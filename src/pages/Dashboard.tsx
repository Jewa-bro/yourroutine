import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactCanvasConfetti from 'react-canvas-confetti';
import Calendar from '../components/dashboard/Calendar';
import { useStore } from '../store/useStore';
import { format, startOfDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import RoutineCard from '../components/routines/RoutineCard';
import TodayTodos from '../components/dashboard/TodayTodos';
import TodayDiary from '../components/dashboard/TodayDiary';
import RoutineProgressBar from '../components/dashboard/RoutineProgressBar';

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
  const { routines, currentDate, routineInstances, confettiFiredFor, setConfettiFiredFor } = useStore();
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 relative"
    >
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
          <TodayTodos />
          <TodayDiary />
        </div>
        
        <div className="space-y-6">
          <Calendar variant="small" />
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;