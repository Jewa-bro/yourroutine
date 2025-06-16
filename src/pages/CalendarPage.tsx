import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Calendar from '../components/dashboard/Calendar';
import DateDetailPanel from '../components/calendar/DateDetailPanel';

const CalendarPage: React.FC = () => {
  const detailPanelRef = useRef<HTMLDivElement>(null);

  const handleMobileDayClick = () => {
    detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col"
    >
      {/* --- 데스크탑 레이아웃 (lg 사이즈 이상) --- */}
      <div className="hidden lg:flex lg:gap-6 p-4 md:p-6">
        <div className="lg:w-2/3">
      <Calendar />
        </div>
        <div className="lg:w-1/3">
          <DateDetailPanel />
        </div>
      </div>

      {/* --- 모바일 레이아웃 (lg 사이즈 미만) --- */}
      <div className="lg:hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Calendar onMobileDayClick={handleMobileDayClick} />
        </div>
        <div ref={detailPanelRef} className="p-4">
          <DateDetailPanel />
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarPage;