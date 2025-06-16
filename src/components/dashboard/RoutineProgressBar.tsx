import React from 'react';
import { motion } from 'framer-motion';
import { Routine, RoutineInstances } from '../../types';
import { format, isToday } from 'date-fns';

interface RoutineProgressBarProps {
  todaysRoutines: Routine[];
  routineInstances: RoutineInstances;
  currentDate: Date;
}

const RoutineProgressBar: React.FC<RoutineProgressBarProps> = ({ todaysRoutines, routineInstances, currentDate }) => {
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const completedCount = todaysRoutines.filter(r => routineInstances[r.id]?.[dateStr] === 'completed').length;
  const totalCount = todaysRoutines.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getBarColor = (percent: number) => {
    // 사용자가 지정한 색상(노란색: #EAB308, 초록색: #22C55E)을 사용합니다.
    // 0%에 가까울 때는 부드러운 빨간색(#F87171)을 사용합니다.
    const p = percent / 100;
    
    const red = { r: 248, g: 113, b: 113 };   // #F87171 (red-400)
    const yellow = { r: 234, g: 179, b: 8 };    // #EAB308 (user-defined)
    const green = { r: 34, g: 197, b: 94 };     // #22C55E (user-defined)

    let r, g, b;

    if (p <= 0.5) {
      // 0% to 50%: Red to Yellow
      const t = p * 2;
      r = Math.round(red.r + t * (yellow.r - red.r));
      g = Math.round(red.g + t * (yellow.g - red.g));
      b = Math.round(red.b + t * (yellow.b - red.b));
    } else {
      // 50% to 100%: Yellow to Green
      const t = (p - 0.5) * 2;
      r = Math.round(yellow.r + t * (green.r - yellow.r));
      g = Math.round(yellow.g + t * (green.g - yellow.g));
      b = Math.round(yellow.b + t * (green.b - yellow.b));
    }

    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const barColor = getBarColor(percentage);

  if (totalCount === 0) {
    return null; // 오늘 루틴이 없으면 아무것도 렌더링하지 않음
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-700">
              {isToday(currentDate)
                ? '오늘의 루틴 진행도'
                : format(currentDate, 'M월 d일의 루틴 진행율')}
            </h3>
            <span className="text-lg font-bold" style={{ color: barColor }}>
                {Math.round(percentage)}%
            </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
                className="h-2.5 rounded-full"
                style={{ backgroundColor: barColor }}
                initial={{ width: '0%' }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
        </div>
    </div>
  );
};

export default RoutineProgressBar; 