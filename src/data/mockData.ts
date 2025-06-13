import { Routine, Todo, Diary, User, Statistics } from '../types';

// 목업 루틴 데이터
export const mockRoutines: Routine[] = [
  {
    id: '1',
    name: '아침 운동',
    startTime: '06:00',
    endTime: '07:00',
    description: '30분 조깅 후 스트레칭',
    daysofweek: [0, 1, 2, 3, 4, 5, 6], // 변경
    color: '#6366F1', // primary
    completed: false,
    icon: 'dumbbell'
  },
  {
    id: '2',
    name: '업무 계획 작성',
    startTime: '08:30',
    endTime: '09:00',
    description: '오늘의 핵심 업무 3가지 결정',
    daysofweek: [0, 1, 2, 3, 4, 5, 6], // 변경
    color: '#A78BFA', // secondary
    completed: false,
    icon: 'clipboard-list'
  },
  {
    id: '3',
    name: '아침 명상',
    startTime: '07:30',
    endTime: '08:00',
    description: '15분 호흡 명상',
    daysofweek: [0, 1, 2, 3, 4, 5, 6], // 변경
    color: '#EC4899', // accent
    completed: false,
    icon: 'leaf'
  },
  {
    id: '4',
    name: '영어 공부',
    startTime: '07:00',
    endTime: '07:30',
    description: '영어 단어 20개 암기',
    daysofweek: [0, 1, 2, 3, 4, 5, 6], // 변경
    color: '#10B981', // success
    completed: false,
    icon: 'book-open'
  },
  {
    id: '5',
    name: '물 한 잔 마시기',
    startTime: '06:30',
    endTime: '06:45',
    description: '기상 직후 물 한 잔',
    daysofweek: [0, 1, 2, 3, 4, 5, 6], // 변경
    color: '#F59E0B', // warning
    completed: false,
    icon: 'glass-water'
  }
];

// 목업 할 일 데이터
export const mockTodos: Todo[] = [
  {
    id: '1',
    content: '프로젝트 제안서 작성',
    dueDate: '2025-03-25',
    priority: 'high',
    completed: false,
    tags: ['업무', '중요'],
    createdAt: '2025-03-20'
  },
  {
    id: '2',
    content: '장보기 (우유, 계란, 과일)',
    dueDate: '2025-03-21',
    priority: 'medium',
    completed: true,
    tags: ['집안일'],
    createdAt: '2025-03-20'
  },
  {
    id: '3',
    content: '휴가 계획 세우기',
    dueDate: '2025-03-30',
    priority: 'low',
    completed: false,
    tags: ['개인', '여가'],
    createdAt: '2025-03-19'
  },
  {
    id: '4',
    content: '병원 예약하기',
    dueDate: '2025-03-22',
    priority: 'high',
    completed: false,
    tags: ['건강', '중요'],
    createdAt: '2025-03-18'
  },
  {
    id: '5',
    content: '어머니 생신 선물 구매',
    dueDate: '2025-03-29',
    priority: 'medium',
    completed: false,
    tags: ['가족', '쇼핑'],
    createdAt: '2025-03-15'
  }
];

// 목업 일기 데이터
export const mockDiaries: Diary[] = [
  {
    id: '1',
    date: '2025-03-20',
    content: '오늘은 오랜만에 아침 운동을 했다. 상쾌한 기분으로 하루를 시작할 수 있어서 좋았다. 업무 계획을 세우고 우선순위를 정하니 효율적으로 일할 수 있었다.',
    mood: 'great',
    createdAt: '2025-03-20'
  },
  {
    id: '2',
    date: '2025-03-19',
    content: '프로젝트 마감이 다가와서 스트레스가 좀 있었지만, 팀원들과 협력하여 문제를 해결했다. 저녁에는 오랜만에 친구와 통화하며 긴장을 풀었다.',
    mood: 'good',
    createdAt: '2025-03-19'
  },
  {
    id: '3',
    date: '2025-03-18',
    content: '평범한 하루였다. 특별한 일은 없었지만, 루틴대로 생활하며 안정감을 느꼈다. 내일은 조금 더 활기찬 하루가 되었으면 좋겠다.',
    mood: 'neutral',
    createdAt: '2025-03-18'
  }
];

// 목업 사용자 데이터
export const mockUser: User = {
  id: 'user-123',
  email: 'user@example.com',
  user_metadata: {
    full_name: '테스트 사용자', // name 대신 full_name 사용 또는 name 추가
    avatar_url: 'https://i.pravatar.cc/150?u=user@example.com',
    // 다른 user_metadata 필드가 있다면 여기에 추가
  },
  created_at: new Date().toISOString(),
  // 필요한 경우 여기에 다른 User 타입 필드 추가
};

// 목업 통계 데이터
export const mockStatistics: Statistics = {
  routineCompletionRate: 68,
  todoCompletionRate: 72,
  dailyCompletionHistory: [
    { date: '2025-03-14', routineRate: 50, todoRate: 60 },
    { date: '2025-03-15', routineRate: 65, todoRate: 70 },
    { date: '2025-03-16', routineRate: 45, todoRate: 55 },
    { date: '2025-03-17', routineRate: 80, todoRate: 75 },
    { date: '2025-03-18', routineRate: 75, todoRate: 80 },
    { date: '2025-03-19', routineRate: 60, todoRate: 85 },
    { date: '2025-03-20', routineRate: 85, todoRate: 90 }
  ],
  weeklyCompletionHistory: [
    { week: '1주차', routineRate: 55, todoRate: 60 },
    { week: '2주차', routineRate: 60, todoRate: 65 },
    { week: '3주차', routineRate: 65, todoRate: 70 },
    { week: '4주차', routineRate: 70, todoRate: 75 }
  ],
  monthlyCompletionHistory: [
    { month: '1월', routineRate: 50, todoRate: 55 },
    { month: '2월', routineRate: 60, todoRate: 65 },
    { month: '3월', routineRate: 70, todoRate: 75 }
  ]
};

export const daysOfWeekNames = ['일', '월', '화', '수', '목', '금', '토'];