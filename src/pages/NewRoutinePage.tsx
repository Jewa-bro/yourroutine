import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Routine } from '../types';
import { Button } from '../components/ui/Button';
import { Save, X, Trash2 } from 'lucide-react';

const availableEmojis = [
  '💪', '🧠', '🧘', '📖', '✍️', '🏃', '☀️', '🌙', '💻', '🎨', '🎵', '☕',
  '🏠', '💼', '🚗', '✈️', '🥗', '💊', '📞', '💬', '🎉', '🎁', '💡', '💰',
  '📈', '🌱', '🧹', '🧺', '🐾', '❤️', '📅', '⏰', '🗺️', '🔑', '💧', '🤸',
  '🚶', '🍳', '📰', '🛌', '😌', '✨', '🙏', '🗣️', '🏋️', '🚴', '🛁', '🐶'
];

type TriggerType = 'time' | 'condition';

// Omit을 사용하여 상태 타입 정의
type FormDataType = Omit<Routine, 'id' | 'status' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'> & {
  description?: string;
  isDaily: boolean;
  triggerType: TriggerType;
};

const NewRoutinePage: React.FC = () => {
  const navigate = useNavigate();
  const { routines, addRoutine, updateRoutine, deleteRoutine } = useStore();
  const { id: routineId } = useParams<{ id: string }>();
  const isEditMode = Boolean(routineId);

  const initialFormData: FormDataType = useMemo(() => ({
    name: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    trigger: '',
    color: '#6366F1',
    icon: '💪',
    daysofweek: [],
    notifications_on: true,
    isDaily: false,
    triggerType: 'time',
  }), []);

  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const colors = [
    '#6366F1', // Indigo
    '#A78BFA', // Violet
    '#EC4899', // Pink
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#D946EF', // Fuchsia
    '#14B8A6', // Teal
    '#6EE7B7', // Green
    '#F97316', // Orange
    '#EF4444', // Red
  ];

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerRef]);

  useEffect(() => {
    if (isEditMode && routineId) {
      const routineToEdit = routines.find(r => r.id === routineId);
      if (routineToEdit) {
        const hasTime = !!routineToEdit.startTime;
        setFormData({
          ...initialFormData, // 기본값으로 시작
          ...routineToEdit,
          startTime: routineToEdit.startTime || '',
          endTime: routineToEdit.endTime || '',
          isDaily: (routineToEdit.daysofweek || []).length === 7,
          triggerType: hasTime ? 'time' : 'condition',
        });
      } else {
        navigate('/routines', { replace: true });
      }
    }
  }, [isEditMode, routineId, routines, navigate, initialFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day: number) => {
    const currentDays = formData.daysofweek;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    
    setFormData(prev => ({ 
      ...prev, 
      daysofweek: newDays,
      isDaily: newDays.length === 7
    }));
  };
  
  const handleDailyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      isDaily: isChecked,
      daysofweek: isChecked ? [0, 1, 2, 3, 4, 5, 6] : []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.daysofweek.length === 0) {
      alert('요일을 하나 이상 선택해주세요.');
      return;
    }

    const { isDaily, triggerType, ...routineData } = formData;
    
    // 이모지가 아닌 아이콘 이름이 들어올 경우를 대비 (호환성)
    if (routineData.icon && routineData.icon.length > 2) {
      routineData.icon = '💡';
    }

    const dataToSubmit: Partial<Omit<Routine, 'id' | 'status' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'>> = {
      ...routineData,
      startTime: null,
      endTime: null,
    };

    if (triggerType === 'time') {
      dataToSubmit.trigger = undefined;
      // 빈 문자열일 경우 null로, 아니면 그대로 할당
      dataToSubmit.startTime = routineData.startTime ? routineData.startTime : null;
      dataToSubmit.endTime = routineData.endTime ? routineData.endTime : null;
    } else {
      dataToSubmit.trigger = routineData.trigger;
      dataToSubmit.startTime = undefined;
      dataToSubmit.endTime = undefined;
    }

    try {
      if (isEditMode && routineId) {
        await updateRoutine(routineId, dataToSubmit);
      } else {
        await addRoutine(dataToSubmit as any);
      }
      navigate('/routines');
    } catch (error) {
      console.error("Error saving routine:", error);
    }
  };

  const handleDelete = async () => {
    if (routineId && window.confirm(`'${formData.name}' 루틴을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await deleteRoutine(routineId);
        navigate('/routines');
      } catch (error) {
        console.error("Error deleting routine:", error);
        alert('루틴 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? '루틴 수정하기' : '새 루틴 만들기'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <div className="flex items-start space-x-4">
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                className="w-20 h-20 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                style={{ backgroundColor: formData.color }}
              >
                <span className="text-4xl">{formData.icon}</span>
              </button>

              <AnimatePresence>
                {isEmojiPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 top-full mt-2 w-72 bg-white rounded-lg shadow-xl p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-800">아이콘 선택</h4>
                      <button type="button" onClick={() => setIsEmojiPickerOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto">
                      {availableEmojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className={`w-10 h-10 rounded-md flex items-center justify-center text-2xl transition-colors ${
                            formData.icon === emoji 
                              ? 'bg-primary-100' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, icon: emoji }));
                            setIsEmojiPickerOpen(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1">
              <label htmlFor="name" className="sr-only">루틴 이름</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-input text-xl font-semibold"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="루틴 이름 (예: 아침 스트레칭)"
              />
              <textarea
                name="description"
                className="form-input mt-2"
                rows={2}
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="설명 (선택사항)"
              />
            </div>
          </div>
          
          {/* 알림 설정 */}
          <div className="flex justify-between items-center">
            <label htmlFor="notifications_on" className="font-medium text-gray-700">
              푸시 알림 받기
            </label>
            <button
              type="button"
              id="notifications_on"
              onClick={() => setFormData(p => ({ ...p, notifications_on: !p.notifications_on }))}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none ${formData.notifications_on ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${formData.notifications_on ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              색상
            </label>
            <div className="flex flex-wrap gap-3">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-9 h-9 rounded-full transition-transform transform hover:scale-110 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(p => ({ ...p, color }))}
                />
              ))}
            </div>
          </div>

          {/* 시간 또는 조건 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">실행 시점</label>
            <div className="flex rounded-md">
              <button type="button" onClick={() => setFormData(p => ({...p, triggerType: 'time'}))} className={`toggle-btn-left ${formData.triggerType === 'time' ? 'active' : ''}`}>시간</button>
              <button type="button" onClick={() => setFormData(p => ({...p, triggerType: 'condition'}))} className={`toggle-btn-right ${formData.triggerType === 'condition' ? 'active' : ''}`}>조건</button>
            </div>
          </div>
          
          {/* 시간 설정 (동적 표시) */}
          <AnimatePresence>
          {formData.triggerType === 'time' && (
            <motion.div 
              initial={{opacity:0, height: 0}} 
              animate={{opacity:1, height: 'auto'}} 
              exit={{opacity:0, height: 0}}
              className="grid grid-cols-2 gap-4 overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label htmlFor="startTime" className="w-20 text-sm font-medium">시작 시간</label>
                  <input
                    id="startTime"
                    type="time"
                    name="startTime"
                    className="form-input"
                    value={formData.startTime || ''}
                    onChange={handleInputChange}
                    disabled={formData.triggerType !== 'time'}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label htmlFor="endTime" className="w-20 text-sm font-medium">종료 시간</label>
                  <input
                    id="endTime"
                    type="time"
                    name="endTime"
                    className="form-input"
                    value={formData.endTime || ''}
                    onChange={handleInputChange}
                    disabled={formData.triggerType !== 'time'}
                  />
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* 조건 설정 (동적 표시) */}
          <AnimatePresence>
          {formData.triggerType === 'condition' && (
            <motion.div 
              initial={{opacity:0, height: 0}} 
              animate={{opacity:1, height: 'auto'}} 
              exit={{opacity:0, height: 0}}
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">실행 조건</label>
              <input
                type="text"
                required={formData.triggerType === 'condition'}
                name="trigger"
                className="form-input"
                value={formData.trigger}
                onChange={handleInputChange}
                placeholder="예: 일어나자마자"
              />
            </motion.div>
          )}
          </AnimatePresence>
          
          {/* 반복 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              반복
            </label>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={formData.isDaily}
                  onChange={handleDailyChange}
                />
                <span>매일</span>
              </label>
              
              {!formData.isDaily && (
                <div className="flex flex-wrap gap-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      className={`w-10 h-10 rounded-full font-medium transition-colors ${
                        formData.daysofweek.includes(index)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleDay(index)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 제출 버튼 */}
          <div className="pt-6 border-t flex justify-between items-center">
            {/* 삭제 버튼 (수정 모드에서만) */}
            <div>
              {isEditMode && (
                <Button type="button" onClick={handleDelete} variant="danger">
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제하기
                </Button>
              )}
            </div>
            
            {/* 취소 및 저장 버튼 */}
            <div className="flex items-center space-x-4">
              <Button type="button" onClick={() => navigate('/routines')} variant="outline">
                <X className="mr-2 h-4 w-4" />
                취소
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? '변경사항 저장' : '루틴 생성'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default NewRoutinePage;