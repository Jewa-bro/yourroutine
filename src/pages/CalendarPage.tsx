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
      className="p-4 md:p-6 h-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 h-full">
          <Calendar />
        </div>
        <div className="h-full">
          <DateDetailPanel />
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarPage;