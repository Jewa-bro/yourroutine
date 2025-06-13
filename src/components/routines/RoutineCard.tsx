import React, { useRef } from 'react';
import { Routine } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Edit2, Trash2, Check, X as XIcon, Clock, Repeat, Bell, BellOff } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { format as formatDate, parse } from 'date-fns';

interface RoutineCardProps {
  routine: Routine;
  date: string;
  variant?: 'dashboard' | 'management';
  onComplete?: (emoji: string, position: { x: number; y: number }) => void;
}

const daysOfWeekNames = ['일', '월', '화', '수', '목', '금', '토'];

const Toggle: React.FC<{ enabled: boolean; onToggle: () => void; }> = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
};

const RoutineCard: React.FC<RoutineCardProps> = ({ routine, date, variant = 'management', onComplete }) => {
  const { setRoutineStatus, toggleRoutineNotification } = useStore();
  const navigate = useNavigate();
  const checkmarkRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: routine.id, disabled: variant === 'dashboard' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  const getRepeatDays = () => {
    if (!routine.daysofweek || routine.daysofweek.length === 0) return '요일 미설정';
    if (routine.daysofweek.length === 7) return '매일';
    const sortedDays = [...routine.daysofweek].sort((a, b) => a - b);
    return sortedDays.map(day => daysOfWeekNames[day]).join(', ');
  };

  const formatTime = (timeString: string | undefined | null): string => {
    if (!timeString) return '미설정';
    try {
      const formatString = timeString.length > 5 ? 'HH:mm:ss' : 'HH:mm';
      const dateObj = parse(timeString, formatString, new Date());
      return formatDate(dateObj, 'HH:mm');
    } catch (e) {
      return '시간오류';
    }
  };

  const handleStatusChange = (newStatus: Routine['status']) => {
    setRoutineStatus(routine.id, date, newStatus);
    if (newStatus === 'completed' && onComplete && checkmarkRef.current) {
      const rect = checkmarkRef.current.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      onComplete(routine.icon || '🎉', position);
    }
  };

  const handleToggleNotification = async () => {
    try {
      await toggleRoutineNotification(routine.id, routine.notifications_on);
    } catch {
      alert('알림 상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleEdit = () => {
    navigate(`/routines/edit/${routine.id}`);
  };

  const handleCardClick = () => {
    if (variant === 'dashboard') {
      const nextStatus = statusConfig[status]?.next || 'completed';
      handleStatusChange(nextStatus as Routine['status']);
    } else if (variant === 'management') {
      handleEdit();
    }
  };
  
  const cardColor = routine.color || '#E5E7EB';
  const status = routine.status;

  const statusConfig = {
    completed: { icon: <Check size={20} className="text-white" />, bg: 'bg-green-500', next: 'skipped' },
    skipped: { icon: <XIcon size={20} className="text-white" />, bg: 'bg-red-500', next: 'unchecked' },
    unchecked: { icon: <div className="w-5 h-5" />, bg: 'bg-gray-200', next: 'completed' },
  };
  const currentStatus = statusConfig[status] || statusConfig.unchecked;

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        className="flex items-center bg-white p-4 rounded-lg shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer"
        onClick={handleCardClick}
        layout
      >
        {variant === 'management' && (
          <div {...attributes} {...listeners} className="p-2 cursor-grab text-gray-400 touch-none">
            <GripVertical size={20} />
          </div>
        )}

        <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0" style={{ backgroundColor: cardColor }}>
          <span className="text-3xl">{routine.icon || '💡'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate" title={routine.name}>{routine.name}</h3>
          <div className="mt-1.5 space-y-1 text-sm">
            <div className="flex items-center font-medium text-gray-800">
              <Clock size={14} className="mr-1.5 text-gray-500" />
              <span>{routine.trigger ? routine.trigger : `${formatTime(routine.startTime)} - ${formatTime(routine.endTime)}`}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Repeat size={14} className="mr-1.5 text-gray-400" />
              <span>{getRepeatDays()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end ml-4" style={{ minWidth: '50px' }}>
          {variant === 'management' ? (
            <Toggle enabled={routine.notifications_on} onToggle={handleToggleNotification} />
          ) : (
            <div
              ref={checkmarkRef}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${currentStatus.bg}`}
            >
              {currentStatus.icon}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RoutineCard;