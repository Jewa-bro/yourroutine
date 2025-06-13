import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TodoItem from './TodoItem';
import { useStore } from '../../store/useStore';
import { Plus, Save, X } from 'lucide-react';
import { Todo } from '../../types'; // Todo 타입을 가져옵니다.

const TodoList: React.FC = () => {
  // 스토어에서 상태와 액션을 가져옵니다.
  const todos = useStore((state) => state.todos);
  const addTodo = useStore((state) => state.addTodo);
  const fetchInitialData = useStore((state) => state.fetchInitialData);
  const user = useStore((state) => state.user);

  // 로컬 상태
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoContent, setNewTodoContent] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');

  // 컴포넌트 마운트 시 사용자의 할 일 목록을 불러옵니다.
  useEffect(() => {
    if (user) { // 로그인한 경우에만 데이터를 불러옵니다.
      // fetchInitialData에는 todos 뿐 아니라 routines, diaries도 포함되어 있으므로
      // 여기서는 todos만 특정해서 다시 불러올 필요는 없을 수 있습니다.
      // 또는 todos만 다시 불러오는 별도의 액션을 만들 수도 있습니다.
      // 현재 fetchInitialData는 user가 변경될 때 자동으로 호출되므로 명시적 호출이 중복될 수 있습니다.
      // useStore 하단의 onAuthStateChange에서 처리됩니다.
    }
  }, [user, fetchInitialData]);

  const today = new Date().toISOString().split('T')[0];
  
  const filteredAndSortedTodos = todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .sort((a, b) => {
      const aIsToday = a.dueDate === today;
      const bIsToday = b.dueDate === today;
      if (aIsToday !== bIsToday) return bIsToday ? 1 : -1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const handleAddTodo = async () => {
    if (!newTodoContent.trim()) {
      alert('할 일 내용을 입력해주세요.');
      return;
    }
    try {
      await addTodo({
        content: newTodoContent.trim(),
        priority: newTodoPriority,
        due_date: newTodoDueDate || undefined, // 빈 문자열이면 undefined로 전달
      });
      setNewTodoContent('');
      setNewTodoPriority('medium');
      setNewTodoDueDate('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add todo:', error);
      alert('할 일 추가에 실패했습니다.');
    }
  };

  return (
    <div className="mb-8 p-4 bg-white shadow rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">할 일 목록</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary py-2 px-4 flex items-center space-x-2 transition-all duration-150 ease-in-out hover:bg-indigo-700"
          >
            <Plus size={20} />
            <span>새 할 일 추가</span>
        </button>
        )}
      </div>
      
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <input
            type="text"
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            placeholder="새로운 할 일 내용 (예: 프로젝트 회의 준비)"
            className="w-full p-2 border border-gray-300 rounded-md mb-3 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
              <select
                id="priority"
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
              <input
                type="date"
                id="dueDate"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min={today} // 오늘 이전 날짜 선택 방지
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setIsAdding(false)}
              className="btn-secondary py-2 px-4 flex items-center space-x-1 transition-all duration-150 ease-in-out hover:bg-gray-300"
            >
              <X size={18}/> 
              <span>취소</span>
        </button>
        <button 
              onClick={handleAddTodo}
              className="btn-primary py-2 px-4 flex items-center space-x-1 transition-all duration-150 ease-in-out hover:bg-indigo-700"
            >
              <Save size={18}/> 
              <span>저장</span>
        </button>
          </div>
        </motion.div>
      )}
      
      <div className="flex space-x-2 mb-4 border-b pb-2">
        {['active', 'completed', 'all'].map(f => (
        <button 
            key={f}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                filter === f 
                ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
            onClick={() => setFilter(f as 'all' | 'active' | 'completed')}
        >
            {f === 'active' ? '미완료' : f === 'completed' ? '완료' : '전체'}
        </button>
        ))}
      </div>
      
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {filteredAndSortedTodos.length > 0 ? (
          filteredAndSortedTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))
        ) : (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'all' ? '할 일이 없습니다.' :
               filter === 'active' ? '미완료된 할 일이 없습니다.' :
               '완료된 할 일이 없습니다.'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? '새 할 일을 추가해보세요!' : '훌륭합니다! 🙌'}
            </p>
            {!isAdding && filter === 'all' && (
                <div className="mt-6">
                    <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    새 할 일 추가하기
                    </button>
                </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TodoList;