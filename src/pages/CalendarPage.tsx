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
      className="p-0 sm:p-4 md:p-6 h-full flex flex-col"
    >
      <div className="flex-grow lg:flex lg:gap-6 h-full">
        <div className="h-full flex-grow lg:flex-grow-0 lg:w-2/3">
          <Calendar />
        </div>
        <div className="hidden lg:block lg:w-1/3 h-full">
          <DateDetailPanel />
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarPage;