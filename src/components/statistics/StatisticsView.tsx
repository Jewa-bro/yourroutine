import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useStore } from '../../store/useStore';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatisticsView: React.FC = () => {
  const { mockStatistics: statistics } = useStore();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">통계 데이터를 불러오는 중...</p>
      </div>
    );
  }
  
  // 차트 데이터 변환
  const getChartData = () => {
    let labels: string[] = [], routineData: number[] = [], todoData: number[] = [];
    
    if (period === 'daily') {
      labels = statistics.dailyCompletionHistory?.map((item) => item.date) || [];
      routineData = statistics.dailyCompletionHistory?.map((item) => item.routineRate) || [];
      todoData = statistics.dailyCompletionHistory?.map((item) => item.todoRate) || [];
    } else if (period === 'weekly') {
      labels = statistics.weeklyCompletionHistory?.map((item) => item.week) || [];
      routineData = statistics.weeklyCompletionHistory?.map((item) => item.routineRate) || [];
      todoData = statistics.weeklyCompletionHistory?.map((item) => item.todoRate) || [];
    } else {
      labels = statistics.monthlyCompletionHistory?.map((item) => item.month) || [];
      routineData = statistics.monthlyCompletionHistory?.map((item) => item.routineRate) || [];
      todoData = statistics.monthlyCompletionHistory?.map((item) => item.todoRate) || [];
    }
    
    return {
      labels,
      datasets: [
        {
          label: '루틴 완료율',
          data: routineData,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
        },
        {
          label: '할 일 완료율',
          data: todoData,
          borderColor: '#A78BFA',
          backgroundColor: 'rgba(167, 139, 250, 0.2)',
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '실천율 추이',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">통계</h2>
      </div>
      
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <motion.div 
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-primary-100">
              <LineChartIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">루틴 완료율</p>
              <h3 className="text-xl font-bold">{statistics.routineCompletionRate ?? 0}%</h3>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${statistics.routineCompletionRate ?? 0}%` }}
            ></div>
          </div>
        </motion.div>
        
        <motion.div 
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-secondary-100">
              <LineChartIcon className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">할 일 완료율</p>
              <h3 className="text-xl font-bold">{statistics.todoCompletionRate ?? 0}%</h3>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-secondary-400 rounded-full"
              style={{ width: `${statistics.todoCompletionRate ?? 0}%` }}
            ></div>
          </div>
        </motion.div>
      </div>
      
      {/* 기간 선택 */}
      <div className="flex space-x-2 mb-4">
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            period === 'daily' 
              ? 'bg-primary-100 text-primary-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setPeriod('daily')}
        >
          일간
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            period === 'weekly' 
              ? 'bg-primary-100 text-primary-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setPeriod('weekly')}
        >
          주간
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            period === 'monthly' 
              ? 'bg-primary-100 text-primary-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setPeriod('monthly')}
        >
          월간
        </button>
      </div>
      
      {/* 차트 */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {period === 'daily' ? (
          <Line data={getChartData()} options={chartOptions} />
        ) : (
          <Bar data={getChartData()} options={chartOptions} />
        )}
      </motion.div>
    </div>
  );
};

export default StatisticsView;