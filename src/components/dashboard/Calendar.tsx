import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay, isSameMonth, isSameYear, startOfDay, getDay, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DayPicker, type DayProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Routine } from '../../types';

// Marquee 컴포넌트 (긴 텍스트 스크롤)
const MarqueeText: React.FC<{ text: string }> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    if (containerRef.current && textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  }, [text]);

  return (
    <div ref={containerRef} className={`truncate ${isOverflowing ? 'marquee' : ''}`}>
      <span ref={textRef} className={isOverflowing ? 'marquee-content' : ''}>
        {text}
      </span>
    </div>
  );
};

interface CalendarProps {
  variant?: 'default' | 'small';
}

const Calendar: React.FC<CalendarProps> = ({ variant = 'default' }) => {
  const {
    currentDate,
    setCurrentDate,
    routines,
    todos,
    diaries,
    routineInstances,
    fetchRoutineCompletionsForMonth,
  } = useStore();
  
  const navigate = useNavigate();
  const isSmall = variant === 'small';
  const [displayedMonthDate, setDisplayedMonthDate] = useState(currentDate);

  useEffect(() => {
    fetchRoutineCompletionsForMonth(displayedMonthDate.getFullYear(), displayedMonthDate.getMonth() + 1);
  }, [displayedMonthDate, fetchRoutineCompletionsForMonth]);

  useEffect(() => {
    if (!isSameMonth(currentDate, displayedMonthDate) || !isSameYear(currentDate, displayedMonthDate)) {
      setDisplayedMonthDate(currentDate);
    }
  }, [currentDate]);

  const handleMonthChange = (newMonth: Date) => {
    setDisplayedMonthDate(newMonth);
  };
  
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    if (!isSameMonth(date, displayedMonthDate) || !isSameYear(date, displayedMonthDate)) {
      setDisplayedMonthDate(date);
    }
    if (isSmall) {
      // 작은 달력에서는 특별한 동작 없음
    } else if (window.innerWidth < 1024) {
      navigate('/dashboard'); // 큰 달력을 모바일에서 볼 때, 날짜 누르면 대시보드로 이동
    }
  };

  const getRoutineCompletionStatusForDate = (date: Date): 'ALL_COMPLETE' | 'SOME_INCOMPLETE' | 'NO_ROUTINES' => {
    const dayOfWeek = getDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const routinesForDayOfWeek = routines.filter(routine => 
      routine.daysofweek.includes(dayOfWeek) && !isBefore(date, startOfDay(new Date(routine.created_at)))
    );
    if (routinesForDayOfWeek.length === 0) return 'NO_ROUTINES';
    for (const routine of routinesForDayOfWeek) {
      if (routineInstances[routine.id]?.[dateStr] !== 'completed') return 'SOME_INCOMPLETE';
    }
    return 'ALL_COMPLETE';
  };

  function DayContent(props: DayProps) { 
    const { date, displayMonth } = props;
    const todosForDay = todos.filter(t => t.dueDate && isSameDay(date, new Date(t.dueDate)));
    const hasDiary = diaries.some(d => isSameDay(date, new Date(d.date)));
    
    // 루틴 완료 상태 (불꽃 아이콘)
    let flameIconContent: string | null = null;
    let flameIconStyle: React.CSSProperties = {};
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!isBefore(date, startOfDay(new Date(routines[0]?.created_at || new Date())))) {
      const completionStatus = getRoutineCompletionStatusForDate(date);
      if (completionStatus === 'ALL_COMPLETE') {
        flameIconContent = '🔥';
      } else if (completionStatus === 'SOME_INCOMPLETE') {
        flameIconContent = '🔥';
        flameIconStyle = { filter: 'grayscale(1)', opacity: 0.5 };
      }
    }

    const dayOfMonth = format(date, 'd');
    const dayNumberClassesList: string[] = [];
    const isOutside = !isSameMonth(date, displayMonth);

    if(isSmall) {
      dayNumberClassesList.push('absolute top-1 left-1 text-xs sm:text-sm');
    } else {
      dayNumberClassesList.push('font-medium mb-1');
    }

    if (isOutside) {
      dayNumberClassesList.push('text-gray-400/80');
    } else if (date.getDay() === 6) {
      dayNumberClassesList.push('text-blue-600');
    } else if (date.getDay() === 0) {
      dayNumberClassesList.push('text-red-600');
    }
    
    // 작은 달력 (대시보드) 뷰
    if (isSmall) {
      return (
        <>
          <span className={dayNumberClassesList.join(' ')}>{dayOfMonth}</span>
          {!isOutside && flameIconContent && (
            <span className="absolute top-0 right-0" style={{ fontSize: '12px', ...flameIconStyle }}>
              {flameIconContent}
            </span>
          )}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
            {!isOutside && todosForDay.length > 0 && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
            {!isOutside && hasDiary && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>}
          </div>
        </>
      );
    }

    // 큰 달력 (캘린더 페이지) 뷰
    const eventsForDay = [
      ...(hasDiary ? [{ id: `diary-${dateStr}`, content: '일기', completed: false, type: 'diary' as const }] : []),
      ...todosForDay.map(t => ({ id: t.id, content: t.content, completed: t.completed, type: 'todo' as const }))
    ];
    
    const maxVisibleEvents = 3;
    const visibleEvents = eventsForDay.slice(0, maxVisibleEvents);
    const hiddenEventsCount = eventsForDay.length - maxVisibleEvents;

    return (
      <div className="flex flex-col h-full p-1.5 overflow-hidden">
        <div className="flex items-center">
          <span className={dayNumberClassesList.join(' ')}>{dayOfMonth}</span>
          {!isOutside && flameIconContent && <span className="ml-auto text-sm" style={{ ...flameIconStyle }}>{flameIconContent}</span>}
        </div>
        <div className="flex-grow space-y-1 mt-1 text-xs overflow-hidden">
          {visibleEvents.map(event => (
            <div key={event.id} title={event.content} className={`p-1 rounded-md text-left text-white ${
              event.type === 'diary' ? 'bg-amber-500' :
              event.completed ? 'bg-green-500' : 'bg-sky-500'
            }`}>
              <MarqueeText text={event.content} />
            </div>
          ))}
          {hiddenEventsCount > 0 && (
             <div className="text-gray-500 text-center text-[10px] pt-1">+ {hiddenEventsCount} more</div>
          )}
        </div>
      </div>
    );
  }
  
  // 캘린더 스타일 동적 할당
  const smallCalendarClasses = {
    root: 'bg-white rounded-lg shadow-md w-full text-xs',
    months: 'w-full',
    month: 'w-full p-2.5 sm:p-3',
    caption: 'flex justify-center relative items-center py-3 mb-2.5 sm:mb-3',
    caption_label: 'font-semibold text-gray-800 text-base sm:text-lg',
    nav: 'space-x-1 sm:space-x-1.5 flex items-center',
    nav_button: 'bg-transparent rounded-full flex items-center justify-center hover:bg-gray-100 h-7 w-7 sm:h-8 sm:w-8',
    nav_button_previous: 'absolute left-2.5',
    nav_button_next: 'absolute right-2.5',
    table: 'w-full border-collapse table-fixed',
    head_row: 'flex font-medium text-gray-500 text-xs sm:text-sm',
    head_cell: 'flex-1 text-center p-1.5 sm:p-2',
    row: 'flex w-full mt-2.5 sm:mt-3',
    cell: 'flex-1 relative text-center p-0',
    day: 'w-full aspect-square rounded-lg hover:bg-gray-100 aria-selected:bg-primary-100 font-medium relative text-xs',
    day_selected: 'bg-primary-500 text-white hover:bg-primary-600 font-semibold',
    day_today: 'font-bold ring-1 ring-offset-0 ring-primary-300',
    day_disabled: 'text-gray-300 opacity-50',
    day_hidden: 'invisible',
  };

  const defaultCalendarClasses = {
    root: 'bg-white w-full h-full flex flex-col',
    months: 'w-full h-full flex flex-col',
    month: 'w-full h-full flex flex-col flex-grow',
    caption: 'flex justify-center relative items-center py-4 px-2 border-b',
    caption_label: 'font-semibold text-gray-800 text-lg sm:text-xl',
    nav: 'space-x-1 sm:space-x-1.5 flex items-center',
    nav_button: 'bg-transparent rounded-full flex items-center justify-center hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9',
    nav_button_previous: 'absolute left-2',
    nav_button_next: 'absolute right-2',
    table: 'w-full border-collapse flex-grow flex flex-col',
    head_row: 'flex font-medium text-gray-500',
    head_cell: 'flex-1 text-center p-2 border-b',
    body: 'flex-grow flex flex-col',
    row: 'flex w-full flex-grow',
    cell: 'flex-1 relative border-r border-b first:border-l last:border-r-0',
    day: 'w-full h-full hover:bg-gray-50',
    day_selected: 'bg-primary-100 hover:bg-primary-100 font-semibold',
    day_today: 'bg-primary-50',
    day_disabled: 'text-gray-300 opacity-50 bg-gray-50',
    day_hidden: 'invisible',
  };

  return (
    <div className={`w-full ${isSmall ? 'max-w-xs mx-auto' : 'h-full'}`}>
      <DayPicker
        mode="single"
        selected={currentDate}
        onDayClick={handleDayClick}
        month={displayedMonthDate}
        onMonthChange={handleMonthChange}
        locale={ko}
        showOutsideDays
        fixedWeeks
        classNames={isSmall ? smallCalendarClasses : defaultCalendarClasses}
        components={{ DayContent }}
      />
    </div>
  );
};

export default Calendar;