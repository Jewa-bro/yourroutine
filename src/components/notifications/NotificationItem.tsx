import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Notification } from '../../types'; // 타입은 나중에 정의해야 합니다.

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`p-3 rounded-lg transition-colors duration-200 ${
        notification.is_read ? 'bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
      }`}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
      style={{ cursor: notification.is_read ? 'default' : 'pointer' }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-3 flex-shrink-0"></div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ko })}
      </p>
    </motion.li>
  );
};

export default NotificationItem; 