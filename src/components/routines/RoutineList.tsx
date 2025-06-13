import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import RoutineCard from './RoutineCard';
import { useStore } from '../../store/useStore';
import { Routine } from '../../types';
import { format } from 'date-fns';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

const RoutineList: React.FC = () => {
  const originalRoutines = useStore((state) => state.routines);
  const updateRoutineOrder = useStore((state) => state.updateRoutineOrder);
  
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [filteredRoutines, setFilteredRoutines] = useState<Routine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const routinesForDay = originalRoutines
      .filter(r => r.daysofweek.includes(selectedDay))
      .sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));
    setFilteredRoutines(routinesForDay);
  }, [originalRoutines, selectedDay]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const routine = filteredRoutines.find(r => r.id === active.id);
    if (routine) {
      setActiveRoutine(routine);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveRoutine(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Optimistically update the visible list for instant feedback
      const oldIndexFiltered = filteredRoutines.findIndex((item) => item.id === active.id);
      const newIndexFiltered = filteredRoutines.findIndex((item) => item.id === over.id);
      setFilteredRoutines(arrayMove(filteredRoutines, oldIndexFiltered, newIndexFiltered));

      // Create the new order for the FULL list of routines
      const oldIndexGlobal = originalRoutines.findIndex((item) => item.id === active.id);
      const newIndexGlobal = originalRoutines.findIndex((item) => item.id === over.id);

      // Ensure items were found before proceeding
      if (oldIndexGlobal === -1 || newIndexGlobal === -1) {
        console.error("Could not find dragged items in the global routine list.");
        // Revert the optimistic update if items are not found
        setFilteredRoutines(filteredRoutines); 
        return;
      }
      
      const newFullList = arrayMove(originalRoutines, oldIndexGlobal, newIndexGlobal);

      setIsSaving(true);
      try {
        await updateRoutineOrder(newFullList);
      } catch (error) {
        console.error("Failed to save routine order", error);
        alert('순서 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        // The store now handles its own rollback, but we can also revert the local view
        // to be sure, using the original routines from before the drag.
        const originalOrderForDay = originalRoutines
          .filter(r => r.daysofweek.includes(selectedDay))
          .sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));
        setFilteredRoutines(originalOrderForDay);
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="mb-8">
      <div className="mb-6 flex justify-center space-x-2 md:space-x-3">
        {dayNames.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`w-12 h-12 rounded-full font-semibold transition-all text-base transform hover:scale-105 ${
              selectedDay === index
                ? 'bg-primary-600 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {filteredRoutines.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredRoutines.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {filteredRoutines.map(routine => (
                <RoutineCard key={routine.id} routine={routine} date={todayStr} variant="management" />
              ))}
            </motion.div>
          </SortableContext>
          <DragOverlay>
            {activeRoutine ? <RoutineCard routine={activeRoutine} date={todayStr} variant="management" /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-white shadow">
          <div className="mx-auto text-6xl text-gray-400 mb-4">😞</div>
          <h3 className="text-lg font-semibold text-gray-800">해당 요일에 등록된 루틴이 없습니다.</h3>
          <p className="mt-2 text-sm text-gray-600">다른 요일을 확인하거나 새 루틴을 추가해보세요.</p>
        </div>
      )}

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-sm py-2 px-4 rounded-lg shadow-lg flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          순서 저장 중...
        </div>
      )}
    </div>
  );
};

export default RoutineList;