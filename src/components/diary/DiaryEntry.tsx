import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { Diary } from '../../types';
import { useStore } from '../../store/useStore';

interface DiaryEntryProps {
  diary: Diary;
}

const DiaryEntry: React.FC<DiaryEntryProps> = ({ diary }) => {
  const { deleteDiary } = useStore();
  
  // 감정 이모지 매핑
  const getMoodEmoji = () => {
    switch(diary.mood) {
      case 'great':
        return '😄';
      case 'good':
        return '🙂';
      case 'neutral':
        return '😐';
      case 'bad':
        return '😔';
      case 'terrible':
        return '😢';
      default:
        return '😐';
    }
  };
  
  // 감정 텍스트 매핑
  const getMoodText = () => {
    switch(diary.mood) {
      case 'great':
        return '아주 좋음';
      case 'good':
        return '좋음';
      case 'neutral':
        return '보통';
      case 'bad':
        return '나쁨';
      case 'terrible':
        return '매우 나쁨';
      default:
        return '보통';
    }
  };

  return (
    <motion.div 
      className="card mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* 일기 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={14} className="mr-1" />
          <span>{diary.date}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xl" title={getMoodText()}>{getMoodEmoji()}</span>
          
          <div className="flex space-x-1">
            <motion.button 
              className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              whileTap={{ scale: 0.9 }}
            >
              <Edit size={14} />
            </motion.button>
            
            <motion.button 
              className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-error-100 hover:text-error-600"
              whileTap={{ scale: 0.9 }}
              onClick={() => deleteDiary(diary.id)}
            >
              <Trash2 size={14} />
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* 일기 내용 */}
      <div className="text-gray-700 whitespace-pre-line">
        {diary.content}
      </div>
    </motion.div>
  );
};

export default DiaryEntry;