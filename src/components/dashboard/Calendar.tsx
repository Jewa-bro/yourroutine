import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay, isSameMonth, isSameYear, startOfDay, getDay, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DayPicker, type DayProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

// Marquee 컴포넌트: 긴 텍스트를 스크롤 효과로 보여줍니다.
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

const Calendar: React.FC = () => {
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
    // 모바일에서는 상세 패널이 없으므로, 날짜 클릭 시 대시보드로 이동하여 상세 내용을 보여주는 것도 고려해볼 수 있습니다.
    if (window.innerWidth < 1024) {
      navigate('/dashboard');
    }
  };

  function DayContent(props: DayProps) { 
    const { date, displayMonth } = props;
    const dayOfMonth = format(date, 'd');
    
    // 데이터 필터링
    const todosForDay = todos.filter(todo => todo.dueDate && isSameDay(date, new Date(todo.dueDate)));
    const hasDiary = diaries.some(diary => isSameDay(date, new Date(diary.date)));
    const dayOfWeek = getDay(date);
    const routinesForDay = routines.filter(r => r.daysofweek?.includes(dayOfWeek) && isSameDay(r.created_at, date) || isBefore(new Date(r.created_at!), date));

    const allEvents = [
      ...routinesForDay.map(r => ({ id: `r-${r.id}`, content: r.name, completed: routineInstances[r.id]?.[format(date, 'yyyy-MM-dd')] === 'completed', type: 'routine' as const })),
      ...todosForDay.map(t => ({ id: `t-${t.id}`, content: t.content, completed: t.completed, type: 'todo' as const }))
    ];
    
    const dayNumberClassesList: string[] = ['font-medium mb-1'];
    const currentDayOfWeek = date.getDay();
    const isOutsideCurrentMonth = !isSameMonth(date, displayMonth);

    if (isOutsideCurrentMonth) {
      dayNumberClassesList.push('text-gray-400/80');
    } else if (currentDayOfWeek === 6) { // 토요일
      dayNumberClassesList.push('text-blue-600');
    } else if (currentDayOfWeek === 0) { // 일요일
      dayNumberClassesList.push('text-red-600');
    }
    
    const maxVisibleEvents = 4; // 셀 당 보여줄 최대 이벤트 수
    const visibleEvents = allEvents.slice(0, maxVisibleEvents);
    const hiddenEventsCount = allEvents.length - maxVisibleEvents;

    return (
      <div className="flex flex-col h-full p-1.5 overflow-hidden">
        <div className="flex items-center">
          <span className={dayNumberClassesList.join(' ')}>{dayOfMonth}</span>
          {hasDiary && !isOutsideCurrentMonth && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full ml-1.5"></div>}
        </div>
        <div className="flex-grow space-y-1 mt-1 text-xs">
          {visibleEvents.map(event => (
            <div
              key={event.id}
              title={event.content}
              className={`p-1 rounded-md text-left text-white ${event.completed ? 'bg-green-500' : (event.type === 'routine' ? 'bg-indigo-500' : 'bg-sky-500')}`}
            >
              <MarqueeText text={event.content} />
            </div>
          ))}
          {hiddenEventsCount > 0 && (
             <div className="text-gray-500 text-center text-[10px] pt-1">
               + {hiddenEventsCount} more
             </div>
          )}
        </div>
      </div>
    );
  }
  
  const calendarClassNames = {
    root: 'bg-white rounded-lg shadow-md w-full h-full flex flex-col',
    months: 'w-full h-full flex flex-col',
    month: 'w-full h-full flex flex-col',
    caption: 'flex justify-center relative items-center py-4 px-2 border-b',
    caption_label: 'font-semibold text-gray-800 text-lg sm:text-xl',
    nav: 'space-x-1 sm:space-x-1.5 flex items-center',
    nav_button: 'bg-transparent rounded-full flex items-center justify-center hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9',
    nav_button_previous: 'absolute left-2',
    nav_button_next: 'absolute right-2',
    table: 'w-full border-collapse table-fixed flex-grow flex flex-col',
    head_row: 'flex font-medium text-gray-500',
    head_cell: 'flex-1 text-center p-2',
    body: 'flex-grow flex flex-col',
    row: 'flex w-full flex-grow',
    cell: 'flex-1 relative text-center p-0 border-r border-t border-gray-200 first:border-l',
    day: 'w-full h-full hover:bg-gray-50',
    day_selected: 'bg-primary-100 hover:bg-primary-100 font-semibold',
    day_today: 'bg-primary-50',
    day_disabled: 'text-gray-300 opacity-50 bg-gray-50',
    day_hidden: 'invisible',
  };

  return (
    <div className="h-full">
      <DayPicker
        mode="single"
        selected={currentDate}
        onDayClick={handleDayClick}
        month={displayedMonthDate}
        onMonthChange={handleMonthChange}
        locale={ko}
        showOutsideDays
        fixedWeeks
        classNames={calendarClassNames}
        components={{ DayContent }}
      />
    </div>
  );
};

export default Calendar;