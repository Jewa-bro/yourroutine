import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Bell, Moon, Sun, Globe } from 'lucide-react';
import { requestNotificationPermission } from '../utils/notification';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useStore();

  const handleNotificationToggle = async () => {
    // 알림을 켜려는 경우
    if (!settings.notifications) {
      const permissionGranted = await requestNotificationPermission();
      if (permissionGranted) {
        updateSettings({ notifications: true });
      } else {
        // 사용자가 권한을 거부하면 토글을 다시 끄고, 아무것도 하지 않음
        alert('브라우저에서 알림 권한이 차단되었습니다. 설정을 변경해주세요.');
      }
    } else {
      // 알림을 끄는 경우
      updateSettings({ notifications: false });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">설정</h1>

        <div className="space-y-6">
          {/* 언어 설정 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">언어</h2>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-gray-600" />
              <select
                className="form-select"
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as 'ko' | 'en' })}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* 알림 설정 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">알림 설정</h2>
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
                  onClick={handleNotificationToggle}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;