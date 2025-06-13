import React from 'react';
import { useStore } from '../../store/useStore';
import { Routine } from '../../types';
import { getRoutineIconByName } from '../../utils/getRoutineIcon.tsx';
import { format, parse } from 'date-fns';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const RoutineTimeline: React.FC = () => {
  const { routines, currentDate, setRoutineStatus } = useStore();
  const currentDay = currentDate.getDay();
  const navigate = useNavigate();

  const routinesForToday = routines
    .filter(routine => (routine.daysofweek || []).includes(currentDay))
    .sort((a, b) => {
      // 조건 기반 루틴을 최상단으로
      if (a.trigger && !b.trigger) return -1;
      if (!a.trigger && b.trigger) return 1;
      
      // 둘 다 조건이거나 둘 다 시간이면 이름순 (또는 다른 기준)
      if (a.trigger && b.trigger) return a.trigger.localeCompare(b.trigger);
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);

      return 0;
    });

  const handleStatusClick = (routine: Routine) => {
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');
    let nextStatus: Routine['status'];

    switch (routine.status) {
      case 'unchecked':
        nextStatus = 'completed';
        break;
      case 'completed':
        nextStatus = 'not_completed';
        break;
      case 'not_completed':
        nextStatus = 'unchecked';
        break;
      default:
        nextStatus = 'unchecked';
    }
    setRoutineStatus(routine.id, todayDateStr, nextStatus);
  };

  const StatusIcon = ({ status }: { status: Routine['status'] }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-success-500" size={24} />;
      case 'not_completed':
        return <XCircle className="text-error-500" size={24} />;
      case 'unchecked':
      default:
        return <Circle className="text-gray-300" size={24} />;
    }
  };

  const formatTime = (timeStr: string | undefined | null): string => {
    if (!timeStr) return '';
    try {
      const date = parse(timeStr, 'HH:mm:ss', new Date());
      return format(date, 'HH:mm');
    } catch {
      try {
        const date = parse(timeStr, 'HH:mm', new Date());
        return format(date, 'HH:mm');
      } catch {
        return '시간오류';
    }
    }
  };

  if (routinesForToday.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">루틴 타임라인</h2>
        <p className="text-gray-600">
          오늘은 <span className="font-semibold text-primary-500">{format(currentDate, 'M월 d일')}</span>에 예정된 루틴이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">루틴 타임라인</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="sr-only">
            <tr>
              <th>순서</th>
              <th>시간</th>
              <th>루틴명</th>
              <th>완료여부</th>
            </tr>
          </thead>
          <tbody>
            {routinesForToday.map((routine, index) => (
              <motion.tr
                key={routine.id}
                className="border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {/* 1. 루틴 순서 */}
                <td className="py-4 px-2 text-center text-sm font-medium text-gray-500 w-12">{index + 1}</td>
                
                {/* 2. 루틴 시간 또는 조건 */}
                <td className="py-4 px-2 text-center text-sm font-medium text-gray-700 w-32">
                  {routine.trigger ? (
                    <span>{routine.trigger}</span>
                  ) : (
                    <>
                      <span>{formatTime(routine.startTime)}</span>
                      <span className="mx-1 text-gray-400">~</span>
                      <span>{formatTime(routine.endTime)}</span>
                    </>
                  )}
                </td>
                
                {/* 3. 루틴 이름 */}
                <td className="py-4 px-2 flex-grow">
                  <div className="flex items-center space-x-3">
                    <span
                      className="p-1.5 rounded-lg text-white text-xs"
                      style={{ backgroundColor: routine.color || '#cccccc' }}
                    >
                      {getRoutineIconByName(routine.icon, 16)}
                  </span>
                    <span className="font-medium text-base text-gray-900">{routine.name}</span>
                </div>
                </td>
                
                {/* 4. 완료 여부 */}
                <td className="py-4 px-2 text-center w-20">
                  <button
                    onClick={() => handleStatusClick(routine)}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={`'${routine.name}' 상태 변경`}
                  >
                    <StatusIcon status={routine.status} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoutineTimeline; 