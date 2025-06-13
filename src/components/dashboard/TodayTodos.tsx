import React from 'react';
import { useStore } from '../../store/useStore';
import { format, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, Square, Clock } from 'lucide-react';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';

const TodayTodos: React.FC = () => {
  const { todos, currentDate, toggleTodoCompletion, openTodoModal } = useStore();
  const navigate = useNavigate();
  const todayStr = format(currentDate, 'yyyy-MM-dd');

  const todaysTodos = todos
    .filter(todo => todo.dueDate.startsWith(todayStr))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleTodoCompletion(id);
  };

  const handleEdit = (todo: typeof todos[0]) => {
    openTodoModal(todo);
  };

  const title = isToday(currentDate) 
    ? "오늘의 할 일" 
    : format(currentDate, "M월 d일의 할 일", { locale: ko });

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {todaysTodos.length > 0 ? (
        <ul className="space-y-3">
          {todaysTodos.map((todo, index) => (
            <motion.li
              key={todo.id}
              onClick={() => handleEdit(todo)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transform transition-all duration-200 cursor-pointer"
            >
              <div className="mr-4 pr-4 border-r border-gray-200 text-center w-20 flex-shrink-0">
                <div className="text-sm font-medium text-primary-500">{format(parseISO(todo.dueDate), 'a', { locale: ko })}</div>
                <div className="text-2xl font-bold text-gray-800 tracking-tight">{format(parseISO(todo.dueDate), 'h:mm')}</div>
              </div>
              <div className="flex-1">
                <span className={`text-base ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {todo.content}
                </span>
              </div>
              <button onClick={(e) => handleToggle(e, todo.id)} className="ml-4 p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                {todo.completed ? <Check className="text-green-500" size={24} /> : <Square className="text-gray-400" size={24} />}
              </button>
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <p>오늘의 할 일이 없습니다.</p>
          <button
            onClick={() => openTodoModal()}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center mx-auto shadow-sm hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            <span>할 일 추가</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TodayTodos; 