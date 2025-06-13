import React from 'react';
import { useStore } from '../../store/useStore';
import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Plus, Book } from 'lucide-react';

const moodEmojis: { [key: string]: string } = {
  great: '😄',
  good: '😊',
  neutral: '😐',
  bad: '😕',
  terrible: '😠',
};

const TodayDiary: React.FC = () => {
  const { diaries, currentDate } = useStore();
  const navigate = useNavigate();
  const todayStr = format(currentDate, 'yyyy-MM-dd');
  
  const todayDiary = diaries.find(diary => diary.date === todayStr);

  const title = isToday(currentDate) 
    ? "오늘의 일기" 
    : format(currentDate, "M월 d일의 일기", { locale: ko });

  const handleCardClick = () => {
    if (todayDiary) {
      navigate(`/diary/edit/${todayDiary.id}`);
    } else {
      navigate(`/diary/new?date=${todayStr}`);
    }
  };

  return (
    <div 
      className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {todayDiary && todayDiary.mood && (
          <span className="text-3xl">{moodEmojis[todayDiary.mood]}</span>
        )}
      </div>

      {todayDiary ? (
        <div className="bg-[#FDFCF2] p-4 rounded-md border border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg mb-2 pb-1 border-b border-gray-300">
            {todayDiary.title || '제목 없음'}
          </h3>
          <div 
            className="text-gray-700 leading-relaxed tracking-wide"
            style={{
              lineHeight: '1.75rem',
              backgroundImage: 'linear-gradient(to bottom, transparent 27px, #E8E8E8 27px)',
              backgroundSize: '100% 28px',
            }}
          >
            <p className="min-h-[84px] line-clamp-3">
              {todayDiary.content || '내용이 없습니다...'}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
          <Book className="mx-auto text-gray-400" size={40} />
          <p className="mt-2">아직 일기를 작성하지 않았습니다.</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center mx-auto shadow-sm hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            <span>일기 작성</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TodayDiary; 