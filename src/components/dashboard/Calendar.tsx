import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay, isSameMonth, isSameYear, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DayPicker, type DayProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

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
    console.log('[Calendar] useEffect: displayedMonthDate changed or initial load', displayedMonthDate);
    fetchRoutineCompletionsForMonth(displayedMonthDate.getFullYear(), displayedMonthDate.getMonth() + 1);
  }, [displayedMonthDate, fetchRoutineCompletionsForMonth]);

  useEffect(() => {
    if (!isSameMonth(currentDate, displayedMonthDate) || !isSameYear(currentDate, displayedMonthDate)) {
        console.log('[Calendar] useEffect: currentDate from store changed month/year, updating displayedMonthDate');
        setDisplayedMonthDate(currentDate);
    }
  }, [currentDate]);

  const handleMonthChange = (newMonth: Date) => {
    console.log('[Calendar] handleMonthChange: newMonth is', newMonth);
    setDisplayedMonthDate(newMonth);
  };
  
  const getDaysWithTodos = () => {
    return todos
      .filter(todo => todo.dueDate)
      .map(todo => startOfDay(new Date(todo.dueDate!)));
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    if (!isSameMonth(date, displayedMonthDate) || !isSameYear(date, displayedMonthDate)) {
      setDisplayedMonthDate(date);
    }
  };

  const getRoutineCompletionStatusForDate = (date: Date): 'ALL_COMPLETE' | 'SOME_INCOMPLETE' | 'NO_ROUTINES' => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = startOfDay(new Date());

    const routinesForDayOfWeek = routines.filter(routine => {
      const createdAt = startOfDay(new Date(routine.created_at!)); // 루틴 생성일
      return (
        Array.isArray(routine.daysofweek) &&
        routine.daysofweek.includes(dayOfWeek) &&
        startOfDay(date) >= createdAt // 생성일 이후의 날짜에만 해당
      );
    });

    if (routinesForDayOfWeek.length === 0) {
      return 'NO_ROUTINES';
    }

    for (const routine of routinesForDayOfWeek) {
      const status = routineInstances[routine.id]?.[dateStr];
      if (status !== 'completed') {
        return 'SOME_INCOMPLETE';
      }
    }
    
    return 'ALL_COMPLETE';
  };

  function DayContent(props: DayProps) { 
    const { date, displayMonth } = props;
    const todosForDay = todos.filter(todo => todo.dueDate && isSameDay(date, new Date(todo.dueDate)));
    const hasDiary = diaries.some(diary => isSameDay(date, new Date(diary.date)));
    
    let flameIconContent: string | null = null;
    let flameIconStyle: React.CSSProperties = {};
    const isPastOrToday = startOfDay(date) <= startOfDay(new Date());

    if(isPastOrToday) {
      const completionStatus = getRoutineCompletionStatusForDate(date);
      if (completionStatus === 'ALL_COMPLETE') {
        flameIconContent = '🔥';
      } else if (completionStatus === 'SOME_INCOMPLETE') {
        flameIconContent = '🔥';
        flameIconStyle = { filter: 'grayscale(1)', opacity: 0.5 };
      }
    }
    const dayOfMonth = format(date, 'd');
    
    const dayNumberClassesList: string[] = [
      isSmall ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg',
      'absolute top-1 left-1',
    ];

    const currentDayOfWeek = date.getDay();
    const isOutsideCurrentMonth = !isSameMonth(date, displayMonth);

    if (isOutsideCurrentMonth) {
      dayNumberClassesList.push('text-gray-400 opacity-70');
    } else if (currentDayOfWeek === 6) {
      dayNumberClassesList.push('text-blue-600');
    } else if (currentDayOfWeek === 0) {
      dayNumberClassesList.push('text-red-600');
    } else if (isSameDay(date, new Date()) && !isSmall) {
      dayNumberClassesList.push('text-primary-700');
    }

    if (isSmall) {
      // 대시보드 (작은 달력) 뷰
      return (
          <>
              <span className={dayNumberClassesList.join(' ')}>{dayOfMonth}</span>
              {flameIconContent && (
                  <span
                      className="absolute top-0 right-0"
                      style={{ fontSize: '12px', ...flameIconStyle }}
                  >
                      {flameIconContent}
                  </span>
              )}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
                  {todosForDay.length > 0 && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                  {hasDiary && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>}
              </div>
          </>
      );
    }

    // 캘린더 페이지 (큰 달력) 뷰
    return (
      <>
        <span className={dayNumberClassesList.join(' ')}>{dayOfMonth}</span>

        <div className="absolute top-1 right-1 flex items-center space-x-1 text-base">
          {hasDiary && <span>📒</span>}
          {flameIconContent && <span style={{ fontSize: '16px', ...flameIconStyle }}>{flameIconContent}</span>}
        </div>
        
        {todosForDay.length > 0 && (
          <div className="absolute top-7 w-full px-1 text-left text-[10px] sm:text-xs leading-tight space-y-0.5 overflow-hidden">
            {todosForDay.slice(0, 2).map(todo => (
              <div
                key={todo.id}
                title={todo.content}
                className={`flex items-center p-1 rounded-sm ${
                  todo.completed ? 'bg-green-100 text-gray-500' : 'bg-blue-100 text-blue-800'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${todo.completed ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                <p className="truncate font-medium">{todo.content}</p>
              </div>
            ))}
            {todosForDay.length > 2 && (
              <div className="text-center text-gray-500 text-[10px] mt-1">+ {todosForDay.length - 2} more</div>
            )}
          </div>
        )}
      </>
    );
  }
  
  const calendarClassNames = {
    root: `bg-white rounded-lg shadow-md w-full ${isSmall ? 'text-xs' : ''}`,
    months: 'w-full',
    month: `w-full ${isSmall ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4 md:p-6 lg:py-7 lg:px-8'}`,
    caption: `flex justify-center relative items-center ${isSmall ? 'py-3 mb-2.5 sm:mb-3' : 'pt-4 pb-6 sm:pb-7 md:pt-3 md:pb-8'}`,
    caption_label: `font-semibold text-gray-800 ${isSmall ? 'text-base sm:text-lg' : 'text-lg sm:text-xl md:text-2xl'}`,
    nav: 'space-x-1 sm:space-x-1.5 flex items-center',
    nav_button: `bg-transparent rounded-full flex items-center justify-center hover:bg-gray-100 ${isSmall ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-8 w-8 sm:h-9 md:h-10'}`,
    nav_button_previous: `absolute ${isSmall ? 'left-2.5' : 'left-2 sm:left-3 md:left-4'}`,
    nav_button_next: `absolute ${isSmall ? 'right-2.5' : 'right-2 sm:right-3 md:right-4'}`,
    table: 'w-full border-collapse table-fixed',
    head_row: `flex font-medium text-gray-500 ${isSmall ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`,
    head_cell: `flex-1 text-center ${isSmall ? 'p-1.5 sm:p-2' : 'p-2 md:p-2.5'}`,
    row: `flex w-full ${isSmall ? 'mt-2.5 sm:mt-3' : 'mt-3 sm:mt-3.5 md:mt-4'}`,
    cell: 'flex-1 relative text-center p-0',
    day: `w-full aspect-square rounded-lg hover:bg-gray-100 aria-selected:bg-primary-100 font-medium relative ${isSmall ? 'text-xs' : 'text-sm md:text-base'}`,
    day_selected: 'bg-primary-500 hover:bg-primary-600 font-semibold',
    day_today: `font-bold ${isSmall ? 'ring-1 ring-offset-0' : 'ring-2 ring-offset-1'} ring-primary-300`,
    day_disabled: 'text-gray-300 opacity-50',
    day_hidden: 'invisible',
  };

  const modifiers = {
    hasTodo: getDaysWithTodos(),
    saturday: (date: Date) => date.getDay() === 6,
    sunday: (date: Date) => date.getDay() === 0,
  };

  const modifiersClassNames = {
    hasTodo: 'day-has-todo',
  };

  return (
    <div className={`mb-8 w-full ${isSmall ? 'max-w-xs mx-auto' : ''}`}>
      <DayPicker
        mode="single"
        selected={currentDate}
        onDayClick={handleDayClick}
        month={displayedMonthDate}
        onMonthChange={handleMonthChange}
        locale={ko}
        showOutsideDays
        fixedWeeks
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        classNames={calendarClassNames}
        components={{
          DayContent: DayContent,
        }}
      />
    </div>
  );
};

export default Calendar;