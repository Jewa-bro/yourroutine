import React from 'react';
import { motion } from 'framer-motion';
import Calendar from '../components/dashboard/Calendar';
import DateDetailPanel from '../components/calendar/DateDetailPanel';

const CalendarPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      {/* --- 데스크탑 레이아웃 (lg 사이즈 이상) --- */}
      <div className="hidden lg:flex lg:gap-6 h-full p-4 md:p-6">
        <div className="lg:w-2/3 h-full">
          <Calendar />
        </div>
        <div className="lg:w-1/3 h-full">
          <DateDetailPanel />
        </div>
      </div>

      {/* --- 모바일 레이아웃 (lg 사이즈 미만) --- */}
      <div className="lg:hidden flex flex-col h-full">
        <div className="h-[60%] border-b border-gray-200">
          <Calendar />
        </div>
        <div className="h-[40%]">
          <DateDetailPanel />
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarPage;