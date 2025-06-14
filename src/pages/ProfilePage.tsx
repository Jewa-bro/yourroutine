import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { User, Mail, Calendar, Edit, Shield, LogOut } from 'lucide-react';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import PasswordChangeModal from '../components/profile/PasswordChangeModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      // 사용자 메타데이터 또는 이메일에서 이름 설정
      setName(user.user_metadata?.name || user.email?.split('@')[0] || '사용자');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600">
        <p>사용자 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  const registrationDate = user.created_at ? format(new Date(user.created_at), 'yyyy년 M월 d일', { locale: ko }) : '알 수 없음';

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  const handleLogout = async () => {
    if(window.confirm('정말로 로그아웃 하시겠습니까?')) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Error during Supabase signout:', error.message);
          alert('로그아웃 중 오류가 발생했습니다.');
        } else {
            localStorage.removeItem('loggedInUser');
            setUser(null);
            console.log('[ProfilePage] 사용자가 로그아웃 되었습니다.');
            navigate('/login');
        }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="bg-slate-50 rounded-xl shadow-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
        <div className="px-6 py-4 -mt-16">
          <div className="flex items-end space-x-5">
            {user.user_metadata?.avatar_url ? (
              <img
                src={`${user.user_metadata?.avatar_url}?t=${new Date().getTime()}`}
                alt="프로필 사진"
                className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-lg"
              />
            ) : (
              <User size={128} className="text-slate-400 bg-white rounded-full p-2 ring-4 ring-white shadow-lg" />
            )}
            <div className="pb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{name}</h1>
              {email && <p className="text-sm text-slate-500 mt-1">{email}</p>}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">프로필 정보</h2>
          <div className="flow-root">
            <dl className="-my-3 divide-y divide-slate-200 text-sm">
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-slate-500">이름</dt>
                <dd className="text-slate-700 sm:col-span-2">{name}</dd>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-slate-500">이메일 (로그인 ID)</dt>
                <dd className="text-slate-700 sm:col-span-2">{email}</dd>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-slate-500">가입일</dt>
                <dd className="text-slate-700 sm:col-span-2">{registrationDate}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="px-6 py-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">활동 요약 (예시)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-100 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500">총 루틴</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">12</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500">완료된 할 일</p>
              <p className="text-2xl font-bold text-secondary-600 mt-1">48</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={handleEditProfile}
            type="button"
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Edit size={18} />
            <span>프로필 수정</span>
          </button>
          <button 
            onClick={handleChangePassword}
            type="button"
            className="btn-outline flex items-center justify-center space-x-2"
          >
            <Shield size={18} />
            <span>비밀번호 변경</span>
          </button>
          <button 
            onClick={handleLogout}
            type="button"
            className="btn-danger flex items-center justify-center space-x-2"
          >
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
      <ProfileEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </motion.div>
  );
};

export default ProfilePage;