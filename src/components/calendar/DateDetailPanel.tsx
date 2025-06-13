import React from 'react';
import { useStore } from '../../store/useStore';
import { format, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckSquare, BookText, Plus, FileSignature } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DateDetailPanel: React.FC = () => {
    const { currentDate, todos, diaries } = useStore();
    const navigate = useNavigate();

    const selectedTodos = todos.filter(todo => 
        todo.dueDate && isSameDay(parseISO(todo.dueDate), currentDate)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const selectedDiary = diaries.find(diary => 
        diary.date && isSameDay(parseISO(diary.date), currentDate)
    );
    
    const formattedDate = format(currentDate, "M월 d일 (eee)", { locale: ko });
    const dateForUrl = format(currentDate, 'yyyy-MM-dd');

    const handleDiaryClick = () => {
        if (selectedDiary) {
            navigate(`/diary/edit/${selectedDiary.id}`);
        } else {
            navigate(`/diary/new?date=${dateForUrl}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800">{formattedDate}</h2>
            
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {/* 할 일 섹션 */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700">
                        <CheckSquare size={20} className="mr-2 text-primary-500" />
                        <span>할 일</span>
                    </h3>
                    {selectedTodos.length > 0 ? (
                        <ul className="space-y-3">
                        {selectedTodos.map(todo => (
                            <li 
                                key={todo.id} 
                                onClick={() => navigate(`/todos/edit/${todo.id}`)}
                                className="flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                            >
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 mr-3 flex-shrink-0 ${todo.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <p className={`flex-1 text-gray-800 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                                    {todo.content}
                                </p>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm py-4 text-center">이 날짜에 예정된 할 일이 없습니다.</p>
                    )}
                </div>

                {/* 일기 섹션 */}
                <div className="cursor-pointer" onClick={handleDiaryClick}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700">
                        <BookText size={20} className="mr-2 text-secondary-500" />
                        <span>일기</span>
                    </h3>
                    {selectedDiary ? (
                        <div className="bg-[#FDFCF2] p-4 rounded-md border border-gray-200 hover:border-primary-300 transition-colors">
                            <h4 className="font-bold text-gray-800 text-lg mb-2 pb-1 border-b border-gray-300 truncate">
                                {selectedDiary.title || '제목 없음'}
                            </h4>
                            <div 
                                className="text-gray-700 leading-relaxed tracking-wide"
                                style={{
                                    lineHeight: '1.75rem',
                                    backgroundImage: 'linear-gradient(to bottom, transparent 27px, #E8E8E8 27px)',
                                    backgroundSize: '100% 28px',
                                }}
                            >
                                <p className="min-h-[56px] line-clamp-2">
                                    {selectedDiary.content || '내용이 없습니다...'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg hover:border-primary-400 hover:text-primary-600 transition-colors">
                            <FileSignature className="mx-auto text-gray-400" size={32} />
                            <p className="mt-2 text-sm font-medium">오늘의 일기를 작성해보세요</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 액션 버튼 */}
            <div className="border-t pt-4 mt-auto">
                <button
                    onClick={() => navigate(`/todos/new?date=${dateForUrl}`)}
                    className="w-full btn-primary flex items-center justify-center"
                >
                    <Plus size={18} className="mr-2" />
                    할 일 추가
                </button>
            </div>
        </div>
    );
};

export default DateDetailPanel; 