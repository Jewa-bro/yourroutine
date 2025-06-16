import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactCanvasConfetti from 'react-canvas-confetti';
import Calendar from '../components/dashboard/Calendar';
import { useStore } from '../store/useStore';
import { format, startOfDay, isToday, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import RoutineCard from '../components/routines/RoutineCard';
import TodayTodos from '../components/dashboard/TodayTodos';
import TodayDiary from '../components/dashboard/TodayDiary';
import RoutineProgressBar from '../components/dashboard/RoutineProgressBar';
import OverdueRoutineModal from '../components/dashboard/OverdueRoutineModal';

// This is a custom hook to get an instance of the confetti animation
const useConfetti = () => {
  const refAnimationInstance = useRef<((opts: any) => void) | null>(null);

  const onInit = useCallback((init: { confetti: (opts: any) => void } | null) => {
    if (init) {
      refAnimationInstance.current = init.confetti;
    }
  }, []);

  const fire = useCallback((options: any) => {
    if (refAnimationInstance.current) {
      refAnimationInstance.current(options);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (refAnimationInstance.current) {
        // This is a way to tell the instance to resize.
        // It's not a direct method but re-initializing can help.
        // A better way is to pass resize: true to the component if supported.
        // Since it is not, we'll manage it manually if needed.
        // For now, let's assume the library handles it somewhat.
        // The issue is likely the props we passed. Let's remove them.
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return { onInit, fire };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { routines, currentDate, routineInstances, confettiFiredFor, setConfettiFiredFor, isAppLoading } = useStore();
  const [isOverdueModalOpen, setOverdueModalOpen] = useState(false);

  if (!routines || !routineInstances) return null;

  const todayStr = format(currentDate, 'yyyy-MM-dd');
  const todayDay = currentDate.getDay();
  
  const { onInit, fire } = useConfetti();

  const firePartyPopper = useCallback(() => {
    const defaults = {
        startVelocity: 35,
        spread: 45,
        ticks: 60,
        zIndex: 100,
        gravity: 0.8,
    };

    const shootFrom = (origin: { x: number, y: number }, angle: number) => {
      const opts = {
        ...defaults,
        origin: origin,
        angle: angle,
      };

      fire({
        ...opts,
        particleCount: 150,
        scalar: 1.5,
        shapes: ['star' as const],
        colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'],
      });

      fire({
        ...opts,
        particleCount: 100,
        scalar: 1,
        shapes: ['circle' as const],
      });
    }

    setTimeout(() => shootFrom({ x: 0.1, y: 0.9 }, 60), 0);
    setTimeout(() => shootFrom({ x: 0.9, y: 0.9 }, 120), 100);
  }, [fire]);

  const [flyingEmojis, setFlyingEmojis] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

  const todaysRoutines = routines.filter(r => {
    const createdAt = startOfDay(new Date(r.created_at));
    return r.daysofweek.includes(todayDay) && startOfDay(currentDate) >= createdAt;
  });

  useEffect(() => {
    if (todaysRoutines.length > 0) {
      const allCompleted = todaysRoutines.every(r => routineInstances[r.id]?.[todayStr] === 'completed');
      const hasBeenFired = confettiFiredFor[todayStr] || false;

      if (allCompleted && !hasBeenFired) {
        firePartyPopper();
        setConfettiFiredFor(todayStr);
      }
    }
  }, [routineInstances, todaysRoutines, todayStr, firePartyPopper, confettiFiredFor, setConfettiFiredFor]);

  const handleRoutineComplete = (emoji: string, position: { x: number; y: number }) => {
    const newEmoji = { id: Date.now(), emoji, ...position };
    setFlyingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFlyingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1200);
  };
  
  const title = isToday(currentDate) 
    ? "오늘의 루틴" 
    : format(currentDate, "M월 d일의 루틴", { locale: ko });

  const noRoutinesMessage = isToday(currentDate)
    ? "오늘의 루틴이 없습니다."
    : "선택한 날짜에 루틴이 없습니다.";

  // streak 계산 함수 (오늘 완료면 오늘부터, 아니면 어제부터)
  function getRoutineStreak() {
    let streak = 0;
    let day = new Date();
    // 오늘 루틴이 모두 완료됐는지 확인
    const todayStr = format(day, 'yyyy-MM-dd');
    const todayDayOfWeek = day.getDay();
    const todayRoutines = routines.filter(r => {
      const createdAt = startOfDay(new Date(r.created_at));
      return r.daysofweek.includes(todayDayOfWeek) && startOfDay(day) >= createdAt;
    });
    const todayAllCompleted = todayRoutines.length > 0 && todayRoutines.every(r => routineInstances[r.id]?.[todayStr] === 'completed');
    if (!todayAllCompleted) {
      // 오늘 완료가 아니면 어제부터 streak 계산
      day = subDays(day, 1);
    }
    while (true) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = day.getDay();
      const routinesForDay = routines.filter(r => {
        const createdAt = startOfDay(new Date(r.created_at));
        return r.daysofweek.includes(dayOfWeek) && startOfDay(day) >= createdAt;
      });
      if (routinesForDay.length === 0) {
        day = subDays(day, 1);
        continue;
      }
      const allCompleted = routinesForDay.every(r => routineInstances[r.id]?.[dayStr] === 'completed');
      if (allCompleted) {
        streak++;
        day = subDays(day, 1);
      } else {
        break;
      }
    }
    return streak;
  }
  const streak = getRoutineStreak();

  // 오늘 endTime이 지난 미완료 루틴 구하기
  const now = new Date();
  const overdueRoutines = routines.filter(r => {
    const createdAt = startOfDay(new Date(r.created_at));
    if (!r.daysofweek.includes(todayDay) || startOfDay(currentDate) < createdAt) return false;
    if (!r.endTime) return false;
    // endTime이 현재 시각보다 이전인지
    const [h, m] = r.endTime.split(':');
    const end = new Date(currentDate);
    end.setHours(Number(h), Number(m), 0, 0);
    if (now < end) return false;
    // 미완료 상태인지
    return routineInstances[r.id]?.[todayStr] !== 'completed' && routineInstances[r.id]?.[todayStr] !== 'skipped';
  });

  useEffect(() => {
    // 앱 최초 로딩이 끝나고, 미완료 루틴이 있을 경우에만 모달을 띄운다.
    if (!isAppLoading && overdueRoutines.length > 0) {
      setOverdueModalOpen(true);
    }
  }, [isAppLoading]); // isAppLoading 상태가 변경될 때만 이 효과를 실행

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 relative"
    >
      <div className="mb-4 flex items-center space-x-2">
        <span className="text-2xl">🔥</span>
        <span className="font-bold text-lg text-primary-600">{streak}일 연속 달성 중!</span>
      </div>
      <RoutineProgressBar 
        todaysRoutines={todaysRoutines} 
        routineInstances={routineInstances} 
        currentDate={currentDate} 
      />
      <ReactCanvasConfetti
        onInit={onInit}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: 50
        }}
      />
      
      <AnimatePresence>
        {flyingEmojis.map(({ id, emoji, x, y }) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, y: -150, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: y,
              left: x,
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              fontSize: '4rem',
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            {todaysRoutines.length > 0 ? (
              <div className="space-y-3">
                {todaysRoutines.map(routine => {
                  const status = routineInstances[routine.id]?.[todayStr] || 'unchecked';
                  const routineWithStatus = { ...routine, status };
                  return (
                    <RoutineCard 
                      key={routine.id} 
                      routine={routineWithStatus} 
                      date={todayStr} 
                      variant="dashboard"
                      onComplete={handleRoutineComplete}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">{noRoutinesMessage}</p>
            )}
          </div>
          <div className="space-y-6">
            <TodayTodos />
            <TodayDiary />
          </div>
        </div>
        
        <div className="hidden lg:block space-y-6">
          <Calendar variant="small" />
        </div>
      </div>

      <AnimatePresence>
        {isOverdueModalOpen && (
          <OverdueRoutineModal 
            onClose={() => setOverdueModalOpen(false)}
            routines={overdueRoutines}
            date={todayStr}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;