import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import DiaryEntry from './DiaryEntry';

const DiaryList: React.FC = () => {
  const { diaries, currentDate } = useStore();
  const navigate = useNavigate();
  
  const diariesForSelectedDate = useMemo(() => {
    return diaries.filter(diary => isSameDay(new Date(diary.date), currentDate));
  }, [diaries, currentDate]);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {format(currentDate, 'M월 d일의 일기', { locale: ko })}
        </h2>
      </div>
      
      {diariesForSelectedDate.length > 0 ? (
        <motion.div layout className="space-y-4">
          {diariesForSelectedDate.map(diary => (
            <DiaryEntry key={diary.id} diary={diary} />
          ))}
        </motion.div>
        ) : (
          <div className="text-center py-8">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">일기 없음</h3>
            <p className="text-gray-500">작성된 일기가 없습니다. 새 일기를 작성해보세요!</p>
          </div>
        )}
    </div>
  );
};

export default DiaryList;