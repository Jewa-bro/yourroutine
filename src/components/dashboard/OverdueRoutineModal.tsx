import React from 'react';
import { Routine } from '../../types';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface OverdueRoutineModalProps {
  onClose: () => void;
  routines: Routine[];
  date: string;
}

const OverdueRoutineModal: React.FC<OverdueRoutineModalProps> = ({ onClose, routines, date }) => {
  const { setRoutineStatus, routineInstances } = useStore(state => ({
    setRoutineStatus: state.setRoutineStatus,
    routineInstances: state.routineInstances,
  }));

  const handleCheck = async (routineId: string) => {
    await setRoutineStatus(routineId, date, 'completed');
  };

  const handleSkip = async (routineId: string) => {
    await setRoutineStatus(routineId, date, 'skipped');
  };
  
  const remainingRoutines = routines.filter(r => {
    const status = routineInstances[r.id]?.[date];
    return status !== 'completed' && status !== 'skipped';
  });

  // 모든 루틴이 처리되면 자동으로 모달 닫기
  React.useEffect(() => {
    if (remainingRoutines.length === 0) {
      onClose();
    }
  }, [remainingRoutines.length, onClose]);


  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xl font-bold text-gray-800 mb-2 text-center">앗! 시간이 지난 루틴이 있어요.</p>
        <p className="text-sm text-gray-600 mb-6 text-center">지금 완료했나요?</p>
        <ul className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
          <AnimatePresence>
            {remainingRoutines.map(routine => (
              <motion.li 
                  key={routine.id} 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                  className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-2xl flex-shrink-0">{routine.icon || '💡'}</span>
                  <div className="overflow-hidden">
                      <p className="font-semibold text-gray-800 truncate">{routine.name}</p>
                      {routine.endTime && <p className="text-xs text-gray-500">~ {routine.endTime.slice(0,5)} 까지</p>}
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                    onClick={() => handleCheck(routine.id)}
                    aria-label="완료"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    onClick={() => handleSkip(routine.id)}
                    aria-label="미완료"
                  >
                    <X size={18} />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default OverdueRoutineModal; 