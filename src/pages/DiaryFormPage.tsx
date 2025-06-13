import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Diary, Mood } from '../types';
import { Button } from '../components/ui/Button';
import { Save, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const DiaryFormPage: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>();
  const navigate = useNavigate();
  const { diaries, addDiary, updateDiary, deleteDiary, user } = useStore();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('neutral');
  const [isEditing, setIsEditing] = useState(false);

  const moodOptions: { value: Mood; emoji: string; label: string }[] = [
    { value: 'great', emoji: '😄', label: '최고예요' },
    { value: 'good', emoji: '😊', label: '좋아요' },
    { value: 'neutral', emoji: '😐', label: '그냥 그래요' },
    { value: 'bad', emoji: '😟', label: '나빠요' },
    { value: 'terrible', emoji: '😭', label: '끔찍해요' },
  ];

  useEffect(() => {
    if (diaryId) {
      const diaryToEdit = diaries.find(d => d.id === diaryId);
      if (diaryToEdit) {
        setDate(new Date(diaryToEdit.date).toISOString().split('T')[0]);
        setTitle(diaryToEdit.title || '');
        setContent(diaryToEdit.content);
        setMood(diaryToEdit.mood);
        setIsEditing(true);
      } else {
        navigate('/diary/new');
      }
    } else {
        const queryParams = new URLSearchParams(window.location.search);
        const dateFromQuery = queryParams.get('date');
        setDate(dateFromQuery || new Date().toISOString().split('T')[0]);
        setTitle('');
        setContent('');
        setMood('neutral');
        setIsEditing(false);
    }
  }, [diaryId, diaries, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (!isEditing && user) {
        const currentUserId = user.id;
        const selectedDate = new Date(date).toISOString().split('T')[0];
        const existingDiary = diaries.find(
          (d) => 
            d.user_id === currentUserId &&
            new Date(d.date).toISOString().split('T')[0] === selectedDate
        );
  
        if (existingDiary) {
          if (window.confirm('이미 해당 날짜에 작성된 일기가 있습니다. 기존 일기를 수정하시겠습니까?')) {
            navigate(`/diary/edit/${existingDiary.id}`);
            return;
          }
          return; 
        }
      }
  
      const diaryData = {
        date: new Date(date).toISOString(),
        title: title.trim() || '제목 없음', // 제목이 비어있으면 '제목 없음'으로 저장
        content,
        mood,
      };
  
      try {
        if (isEditing && diaryId) {
          await updateDiary(diaryId, diaryData);
          alert('일기가 수정되었습니다.');
        } else {
          await addDiary(diaryData as Omit<Diary, 'id' | 'createdAt' | 'user_id'>); 
          alert('일기가 저장되었습니다.');
        }
        navigate('/dashboard');
      } catch (error: any) {
        console.error('일기 저장/수정 중 오류 발생:', error);
        alert('일기 처리 중 오류가 발생했습니다.');
      }
  };

  const handleDelete = async () => {
    if (diaryId && isEditing) {
      if (window.confirm('정말로 이 일기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        try {
          await deleteDiary(diaryId);
          alert('일기가 삭제되었습니다.');
          navigate('/dashboard');
        } catch (error) {
          console.error("일기 삭제 중 오류 발생:", error);
          alert('일기 삭제에 실패했습니다.');
        }
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 bg-gray-50 min-h-screen"
    >
      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto bg-[#FDFCF2] rounded-lg shadow-lg p-6 md:p-8 border border-gray-200">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b-2 border-gray-300 pb-4 mb-4">
            <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-gray-600 font-semibold bg-transparent focus:outline-none mb-2 sm:mb-0"
                required
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">오늘의 기분:</span>
              <div className="flex flex-wrap gap-1">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMood(option.value)}
                    className={`w-8 h-8 rounded-full text-xl transition-transform duration-150 ease-in-out flex items-center justify-center
                      ${mood === option.value ? 'transform scale-125 ring-2 ring-offset-1 ring-primary-400' : 'hover:scale-110'}`}
                    title={option.label}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요..."
              className="w-full text-2xl font-bold bg-transparent focus:outline-none border-b border-dashed border-gray-300 pb-2"
            />
          </div>

          <div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              placeholder="오늘 하루는 어땠나요?"
              className="w-full bg-transparent focus:outline-none resize-none tracking-wide"
              style={{
                lineHeight: '2rem',
                backgroundImage: 'linear-gradient(to bottom, transparent 31px, #E8E8E8 31px)',
                backgroundSize: '100% 32px',
              }}
              required
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-6 pt-6 border-t flex justify-between items-center">
            <div>
              {diaryId && (
                <Button type="button" onClick={handleDelete} variant="danger">
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제하기
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button type="button" onClick={() => navigate(-1)} variant="outline">
                <X className="mr-2 h-4 w-4" />
                취소
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {diaryId ? '변경사항 저장' : '일기 저장'}
              </Button>
            </div>
          </div>
      </form>
    </motion.div>
  );
};

export default DiaryFormPage; 