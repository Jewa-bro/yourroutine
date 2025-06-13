import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRoutineIconByName } from '../utils/getRoutineIcon.tsx';
import { Routine } from '../types';
import { useNavigate } from 'react-router-dom';

const RoutineCheckPage: React.FC = () => {
  const { routines, setRoutineStatus } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  
  const getPastUncheckedRoutines = () => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    return routines.filter(routine => {
      if (!routine.endTime || routine.status !== 'unchecked') {
        return false;
      }
      const isForToday = (routine.daysofweek || []).includes(currentDayOfWeek);
      if (!isForToday) {
        return false;
      }
      const [routineHour, routineMinutes] = routine.endTime.split(':').map(Number);
      return routineHour < currentHour || (routineHour === currentHour && routineMinutes < currentMinutes);
    });
  };

  const uncheckedRoutines = getPastUncheckedRoutines();
  const currentRoutine = uncheckedRoutines[currentIndex];

  const handleNext = () => {
    if (currentIndex < uncheckedRoutines.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleComplete = (routineId: string, completed_date: string, isCompleted: boolean) => {
    const statusToSet: Routine['status'] = isCompleted ? 'completed' : 'not_completed';
    console.log(`[RoutineCheckPage] handleComplete called. routineId: ${routineId}, date: ${completed_date}, newStatus: ${statusToSet}`);
    setRoutineStatus(routineId, completed_date, statusToSet);
    
    if (currentIndex < uncheckedRoutines.length - 1) {
      setTimeout(handleNext, 300);
    } else if (uncheckedRoutines.length === 1 && currentIndex === 0) {
      // 마지막 남은 루틴을 처리한 경우 (완료/미완료 무관하게)
      // uncheckedRoutines 배열이 비게 되므로, 페이지가 "모든 루틴 확인" 상태로 바뀔 것임.
      // 이 경우 추가적인 핸들링이 필요하면 여기에 작성 (예: 다른 페이지로 이동)
      // 지금은 특별한 동작 없음. useStore의 fetchInitialData가 상태를 갱신할 것임.
    }
  };

  // 스와이프 관련 상태
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) { // 왼쪽으로 스와이프
      handleNext();
    }
    if (touchStart - touchEnd < -100) { // 오른쪽으로 스와이프
      handlePrev();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  if (uncheckedRoutines.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 p-4">
        <div className="text-center max-w-sm w-full bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-2">모든 루틴을 확인했어요!</h2>
          <p className="text-gray-600">
            {format(new Date(), 'M월 d일 (E)', { locale: ko })}에
            확인할 루틴이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-50 pt-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 정보 */}
      <div className="text-center mb-6">
        <p className="text-lg font-medium text-gray-800">
          {format(new Date(), 'M월 d일 (E)', { locale: ko })}
        </p>
        <div className="flex items-center justify-center space-x-2 mt-2">
          {uncheckedRoutines.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentIndex ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 루틴 카드 */}
      <div className="flex-1 relative">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentRoutine.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
              <div 
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 text-white"
                style={{ backgroundColor: currentRoutine.color }}
              >
                {getRoutineIconByName(currentRoutine.icon, 36)}
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-3">
                  {currentRoutine.name}
                </h1>
                <p className="text-gray-600 text-lg mb-2">
                  {formatTime(currentRoutine.startTime)} - {formatTime(currentRoutine.endTime)}
                </p>
                {currentRoutine.description && (
                  <p className="text-gray-500">
                    {currentRoutine.description}
                  </p>
                )}
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold mb-2">
                  루틴을 완료하셨나요?
                </h2>
                <p className="text-gray-600">
                  시간이 지났어요
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <motion.button
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleComplete(currentRoutine.id, format(new Date(), 'yyyy-MM-dd'), false)}
                >
                  <X size={24} />
                  <span className="text-lg">못했어요</span>
                </motion.button>
                <motion.button
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-primary-500 text-white hover:bg-primary-600"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleComplete(currentRoutine.id, format(new Date(), 'yyyy-MM-dd'), true)}
                >
                  <Check size={24} />
                  <span className="text-lg">완료했어요</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between px-4 py-8">
        <motion.button
          className={`p-4 rounded-full ${
            currentIndex > 0 
              ? 'bg-white shadow-md text-gray-700' 
              : 'bg-gray-100 text-gray-400'
          }`}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} />
        </motion.button>
        <motion.button
          className={`p-4 rounded-full ${
            currentIndex < uncheckedRoutines.length - 1 
              ? 'bg-white shadow-md text-gray-700' 
              : 'bg-gray-100 text-gray-400'
          }`}
          whileTap={{ scale: 0.9 }}
          onClick={handleNext}
          disabled={currentIndex === uncheckedRoutines.length - 1}
        >
          <ChevronRight size={24} />
        </motion.button>
      </div>
    </div>
  );
};

const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  try {
    const date = new Date(`1970-01-01T${timeString}`);
    return format(date, 'HH:mm');
  } catch {
    return '시간오류';
  }
}

export default RoutineCheckPage;