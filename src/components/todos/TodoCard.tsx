import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Todo } from '../../types';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Check, Edit2, Trash2, Tag, Calendar, AlertTriangle } from 'lucide-react';

interface TodoCardProps {
  todo: Todo;
}

const priorityConfig = {
  high: { label: '높음', color: 'text-red-500', icon: <AlertTriangle size={14} /> },
  medium: { label: '중간', color: 'text-yellow-500', icon: <AlertTriangle size={14} /> },
  low: { label: '낮음', color: 'text-blue-500', icon: <AlertTriangle size={14} /> },
};

const TodoCard: React.FC<TodoCardProps> = ({ todo }) => {
  const { toggleTodoCompletion, deleteTodo } = useStore();
  const navigate = useNavigate();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTodoCompletion(todo.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`'${todo.content}' 할 일을 정말 삭제하시겠습니까?`)) {
      deleteTodo(todo.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/todos/edit/${todo.id}`); // Note: This route needs to be created
  };
  
  const currentPriority = priorityConfig[todo.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${todo.completed ? 'border-green-400' : 'border-gray-300'} transition-colors duration-300`}
      onClick={handleEdit}
    >
      <div className="flex items-start">
        <button
          onClick={handleToggle}
          className={`w-6 h-6 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${
            todo.completed ? 'bg-green-500' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {todo.completed && <Check size={16} className="text-white" />}
        </button>
        <div className="flex-1">
          <p className={`text-gray-800 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            {todo.content}
          </p>
          <div className="mt-2 space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar size={14} className="mr-2 text-gray-400" />
              <span>{format(parseISO(todo.dueDate), 'yyyy년 M월 d일 HH:mm')}</span>
            </div>
            <div className={`flex items-center ${currentPriority.color}`}>
              {currentPriority.icon}
              <span className="ml-2 font-medium">{currentPriority.label}</span>
            </div>
            {todo.tags && todo.tags.length > 0 && (
              <div className="flex items-center text-gray-500">
                <Tag size={14} className="mr-2 text-gray-400" />
                <span>{todo.tags.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-2 ml-4">
          <button onClick={handleEdit} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100">
            <Edit2 size={16} />
          </button>
          <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TodoCard; 