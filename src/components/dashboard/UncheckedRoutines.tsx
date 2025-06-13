import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Check, AlertCircle, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { format, parse } from 'date-fns';
import { getRoutineIconByName } from '../../utils/getRoutineIcon.tsx';
import { Routine } from '../../types';

const UncheckedRoutines: React.FC = () => {
  const { routines, setRoutineStatus } = useStore();
  const navigate = useNavigate();
  
  const getPastUncheckedRoutines = () => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0=일, 1=월, ...
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    return routines.filter(routine => {
      // 0. 시간 기반 루틴인지 먼저 확인 (endTime이 있어야 함)
      if (!routine.endTime) {
        return false;
      }

      // 1. Check if the routine is scheduled for today's day of the week
      const isForToday = (routine.daysofweek || []).includes(currentDayOfWeek);
      if (!isForToday) {
        return false;
      }

      // 2. Check if the status is 'unchecked'
      if (routine.status !== 'unchecked') {
        return false;
      }

      // 3. Check if the end time has passed
      const [routineHour, routineMinutes] = routine.endTime.split(':').map(Number);
      if (routineHour < currentHour || (routineHour === currentHour && routineMinutes < currentMinutes)) {
        return true;
      }

      return false;
    });
  };

  const uncheckedRoutines = getPastUncheckedRoutines();
  
  if (uncheckedRoutines.length === 0) return null;

  const handleRoutineAction = (routineId: string, statusToSet: 'completed' | 'not_completed') => {
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    setRoutineStatus(routineId, todayDate, statusToSet);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '미설정';
    const isValidFormat = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(timeString);
    if (!isValidFormat) return '시간오류';

    try {
      const formatString = timeString.length > 5 ? 'HH:mm:ss' : 'HH:mm';
      const date = parse(timeString, formatString, new Date());
    return format(date, 'HH:mm');
    } catch (error) {
      console.error(`Error formatting time: ${timeString}`, error);
      return '변환오류';
    }
  };

  return (
    <motion.div 
      className="mb-6 bg-amber-50 rounded-xl p-6 border border-amber-200"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 rounded-full">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-800">확인이 필요한 루틴</h2>
            <p className="text-amber-600 text-base mt-0.5">
              {uncheckedRoutines.length}개의 루틴이 완료되었는지 확인해주세요
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {uncheckedRoutines.map(routine => (
          <motion.div 
            key={routine.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="p-5 border-l-4" style={{ borderColor: routine.color }}>
              <div className="flex items-start mb-3">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 text-white"
                  style={{ backgroundColor: routine.color }}
                >
                  {getRoutineIconByName(routine.icon, 32)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xl text-gray-900 truncate">{routine.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Clock size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {formatTime(routine.startTime!)}-{formatTime(routine.endTime!)}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-base mb-4">
                이 루틴을 완료하셨나요?
              </p>
              
              <div className="flex space-x-3">
                <button 
                  className="flex-1 flex items-center justify-center space-x-2 py-3.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => handleRoutineAction(routine.id, 'not_completed')}
                >
                  <X size={22} />
                  <span className="font-medium text-base">못했어요</span>
                </button>
                <button 
                  className="flex-1 flex items-center justify-center space-x-2 py-3.5 bg-success-50 text-success-700 rounded-lg hover:bg-success-100 transition-colors"
                  onClick={() => handleRoutineAction(routine.id, 'completed')}
                >
                  <Check size={22} />
                  <span className="font-medium text-base">완료했어요</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button 
          className="inline-flex items-center px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-base font-medium"
          onClick={() => navigate('/routine-check')}
        >
          모든 루틴 확인하기
        </button>
      </div>
    </motion.div>
  );
};

export default UncheckedRoutines;