import React from 'react';
import { motion } from 'framer-motion';
import StatisticsView from '../components/statistics/StatisticsView';

const StatisticsPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <StatisticsView />
    </motion.div>
  );
};

export default StatisticsPage;