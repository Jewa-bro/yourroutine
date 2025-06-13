import React from 'react';
import { motion } from 'framer-motion';
import RoutineList from '../components/routines/RoutineList';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const RoutinePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6"
    >
      <RoutineList />
      <div 
        onClick={() => navigate('/routines/new')}
        className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
      >
        <div className="flex justify-center items-center">
          <Plus size={22} className="text-gray-500 mr-2" />
          <span className="font-semibold text-gray-700">새 루틴 추가</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RoutinePage;