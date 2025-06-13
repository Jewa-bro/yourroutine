import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { format, parseISO } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Save, X, Trash2 } from 'lucide-react';
import { Todo } from '../../types';

const TodoFormModal: React.FC = () => {
  const { 
    isTodoModalOpen, 
    closeTodoModal, 
    editingTodo,
    addTodo, 
    updateTodo, 
    deleteTodo,
    currentDate
  } = useStore();

  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');

  const isEditMode = Boolean(editingTodo);

  useEffect(() => {
    if (isTodoModalOpen) {
      if (editingTodo) {
        setContent(editingTodo.content);
        setDueDate(format(parseISO(editingTodo.dueDate), "yyyy-MM-dd'T'HH:mm"));
      } else {
        // 새 할 일 모드: 상태 초기화
        setContent('');
        setDueDate(format(currentDate, "yyyy-MM-dd'T'09:00"));
      }
    }
  }, [isTodoModalOpen, editingTodo, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('할 일을 입력해주세요.');
      return;
    }

    const todoData = {
      content,
      dueDate: dueDate,
    };

    try {
      if (isEditMode && editingTodo) {
        await updateTodo(editingTodo.id, todoData);
      } else {
        await addTodo(todoData as Omit<Todo, 'id' | 'createdAt' | 'completed'>);
      }
      closeTodoModal();
    } catch (error) {
      console.error("Failed to save todo:", error);
      alert('할 일 저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (editingTodo) {
      if (window.confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
        try {
          await deleteTodo(editingTodo.id);
          closeTodoModal();
        } catch (error) {
          console.error("Failed to delete todo:", error);
          alert('할 일 삭제에 실패했습니다.');
        }
      }
    }
  };

  return (
    <AnimatePresence>
      {isTodoModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeTodoModal}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? '할 일 수정' : '새 할 일 추가'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form content from NewTodoPage */}
              <div>
                <label htmlFor="content-modal" className="block text-sm font-medium text-gray-700 mb-1">
                  할 일
                </label>
                <input
                  type="text"
                  id="content-modal"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="예: 프로젝트 회의 준비"
                />
              </div>

              <div>
                <label htmlFor="dueDate-modal" className="block text-sm font-medium text-gray-700 mb-1">
                  마감일
                </label>
                <input
                  type="datetime-local"
                  id="dueDate-modal"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-6 border-t flex justify-between items-center">
                <div>
                  {isEditMode && (
                    <Button type="button" onClick={handleDelete} variant="danger">
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제하기
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <Button type="button" onClick={closeTodoModal} variant="outline">
                    <X className="mr-2 h-4 w-4" />
                    취소
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? '변경사항 저장' : '할 일 추가'}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TodoFormModal; 