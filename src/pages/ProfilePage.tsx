import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { User, Mail, Calendar, Edit, Shield, LogOut, Bell } from 'lucide-react';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import PasswordChangeModal from '../components/profile/PasswordChangeModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, setUser, settings, updateSettings } = useStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600">
        <p>사용자 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  const handleSendTestNotification = async () => {
    if (!user) return;
    setIsSendingTest(true);
    try {
      // 알림 권한 강제 확인 및 요청
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.');
          setIsSendingTest(false);
          return;
        }
      }

      // 푸시 구독 확인 및 재등록
      const { subscribeToPushNotifications } = await import('../utils/notification');
      await subscribeToPushNotifications();

      const { error } = await supabase.functions.invoke('send-test-notification', {
        body: { userId: user.id },
      });

      if (error) {
        throw error;
      }
      toast.success('테스트 알림을 전송했습니다. 기기를 확인해주세요!');
    } catch (err: any) {
      console.error('Error sending test notification:', err);
      toast.error(`알림 전송에 실패했습니다: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // 스토어의 user 객체에서 직접 값을 사용
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || '사용자';
  const email = user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url;

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
            {avatarUrl ? (
              <img
                src={`${avatarUrl}?t=${new Date().getTime()}`}
                alt="프로필 사진"
                className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-lg"
              />
            ) : (
              <User size={128} className="text-slate-400 bg-white rounded-full p-2 ring-4 ring-white shadow-lg" />
            )}
            <div className="pb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{displayName}</h1>
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
                <dd className="text-slate-700 sm:col-span-2">{displayName}</dd>
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

        {/* 알림 설정 - 위치 이동 */}
        <div className="px-6 py-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">알림 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <span>알림 사용</span>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications ? 'bg-primary-600' : 'bg-gray-200'
                }`}
                onClick={async () => {
                  if (!settings.notifications) {
                    // 알림을 켜려는 경우 권한 요청
                    const { requestNotificationPermission, subscribeToPushNotifications } = await import('../utils/notification');
                    const granted = await requestNotificationPermission();
                    if (granted) {
                      await subscribeToPushNotifications();
                      updateSettings({ notifications: true });
                      toast.success('알림이 설정되었습니다!');
                    } else {
                      toast.error('알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.');
                    }
                  } else {
                    // 알림을 끄는 경우
                    updateSettings({ notifications: false });
                    toast.success('알림이 해제되었습니다.');
                  }
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.notifications && (
              <>
                <div className="flex items-center justify-between pl-7">
                  <span>루틴 알림</span>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.routineReminders ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    onClick={() => updateSettings({ routineReminders: !settings.routineReminders })}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.routineReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pl-7">
                  <span>할 일 알림</span>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.todoReminders ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    onClick={() => updateSettings({ todoReminders: !settings.todoReminders })}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.todoReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pl-7">
                  <span>알림 시간</span>
                  <select
                    className="form-select w-32"
                    value={settings.reminderTime}
                    onChange={(e) => updateSettings({ reminderTime: Number(e.target.value) })}
                  >
                    <option value="5">5분 전</option>
                    <option value="10">10분 전</option>
                    <option value="15">15분 전</option>
                    <option value="30">30분 전</option>
                    <option value="60">1시간 전</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-600">푸시 알림 테스트</span>
                    <p className="text-xs text-slate-500 mt-1">
                      현재 기기로 테스트 알림을 보내 정상 작동하는지 확인합니다.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (Notification.permission === 'granted') {
                          new Notification('브라우저 알림 테스트', {
                            body: '브라우저 기본 알림이 정상 작동합니다!',
                            icon: '/logo192.svg'
                          });
                        } else {
                          toast.error('알림 권한이 필요합니다.');
                        }
                      }}
                      className="btn-secondary text-sm px-3 py-2"
                    >
                      브라우저 알림
                    </button>
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      disabled={isSendingTest}
                      className="btn-primary-outline text-sm px-4 py-2"
                    >
                      {isSendingTest ? '전송 중...' : '푸시 알림'}
                    </button>
                  </div>
                </div>
              </>
            )}
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