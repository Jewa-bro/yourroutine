import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import NotificationItem from './NotificationItem';
import { Notification } from '../../types';
import { Bell, X } from 'lucide-react';

interface NotificationListProps {
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useStore(state => state.user);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20); // 최근 20개만 가져옵니다.

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
      }
      setIsLoading(false);
    };

    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      // Rollback on error
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      // Optimistic UI update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        // Rollback
        setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: false } : n));
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-16 right-4 w-80 max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 z-50"
    >
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-800">알림</h3>
        <div className='flex items-center gap-2'>
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-700 disabled:text-gray-400"
              disabled={!notifications.some(n => !n.is_read)}
            >
              모두 읽음
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
            </button>
        </div>
      </div>

      <div className="p-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-center text-gray-500">불러오는 중...</p>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 flex flex-col items-center gap-4">
            <Bell size={32} className="text-gray-300"/>
            <span>새로운 알림이 없습니다.</span>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationList; 