import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, Clock, Edit, Trash2 } from 'lucide-react';
import { Todo } from '../../types';
import { useStore } from '../../store/useStore';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TodoItemProps {
  todo: Todo;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const { toggleTodoCompleted, deleteTodo } = useStore();
  
  // 우선순위에 따른 배지 색상 결정
  const getPriorityBadge = () => {
    switch(todo.priority) {
      case 'high':
        return <span className="badge-error">높음</span>;
      case 'medium':
        return <span className="badge-warning">중간</span>;
      case 'low':
        return <span className="badge-success">낮음</span>;
      default:
        return null;
    }
  };
  
  // 마감일까지 남은 시간 계산
  const getDaysRemaining = () => {
    if (!todo.dueDate) return null;
    
    const dueDate = new Date(todo.dueDate);
    const now = new Date();
    
    if (dueDate < now) {
      return <span className="text-error-600">기한 초과</span>;
    }
    
    return (
      <span className="text-gray-500">
        {formatDistanceToNow(dueDate, { addSuffix: true, locale: ko })}
      </span>
    );
  };

  // 날짜 포맷
  const formatDate = (date: string) => {
    return format(new Date(date), 'M월 d일 (E)', { locale: ko });
  };

  return (
    <motion.div 
      className={`card mb-3 ${todo.completed ? 'bg-gray-50 border border-gray-200' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      layout
    >
      <div className="flex items-start">
        {/* 체크박스 - 터치 영역 확대 */}
        <motion.button
          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 mt-1 ${
            todo.completed 
              ? 'bg-primary-500 border-primary-500 text-white' 
              : 'border-gray-300 hover:border-primary-500'
          }`}
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleTodoCompleted(todo.id)}
        >
          {todo.completed && <Check size={16} />}
        </motion.button>
        
        {/* 할 일 내용 - 터치 영역 확대 */}
        <div className="flex-1 py-1">
          <p className={`text-base md:text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {todo.content}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-2 text-sm md:text-xs">
            {/* 마감일 */}
            {todo.dueDate && (
              <div className="flex items-center text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <Calendar size={14} className="mr-1.5" />
                <span>{formatDate(todo.dueDate)}</span>
              </div>
            )}
            
            {/* 남은 시간 */}
            {todo.dueDate && (
              <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
                <Clock size={14} className="mr-1.5" />
                {getDaysRemaining()}
              </div>
            )}
            
            {/* 우선순위 */}
            {getPriorityBadge()}
            
            {/* 태그 */}
            {todo.tags.map((tag, index) => (
              <span key={index} className="badge-primary px-3 py-1.5">{tag}</span>
            ))}
          </div>
        </div>
        
        {/* 액션 버튼 - 터치 영역 확대 */}
        <div className="flex space-x-2 ml-3">
          <motion.button 
            className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            whileTap={{ scale: 0.9 }}
          >
            <Edit size={20} />
          </motion.button>
          
          <motion.button 
            className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-error-100 hover:text-error-600"
            whileTap={{ scale: 0.9 }}
            onClick={() => deleteTodo(todo.id)}
          >
            <Trash2 size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default TodoItem;