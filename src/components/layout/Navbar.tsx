import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Bell, CalendarDays, Home, ListChecks, UserCircle2, Menu, Settings, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import NotificationList from '../notifications/NotificationList';

interface NavbarProps {
  toggleSidebar?: () => void;
  handleSignOut: () => void;
}

const navLinks = [
    { name: '루틴', path: '/routines', icon: ListChecks },
    { name: '대시보드', path: '/dashboard', icon: Home },
    { name: '캘린더', path: '/calendar', icon: CalendarDays },
];

const Navbar: React.FC<NavbarProps> = ({ handleSignOut }) => {
  const { user, setUser } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || null;
  };
  const avatarUrl = getUserAvatar();

  const handleLogout = () => {
    handleSignOut();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-gray-200 bg-white/95">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 모바일 버전에서는 빈 공간으로 대체 */}
          <div className="lg:hidden w-8"></div>
          
          {/* 아이콘 네비게이션 (중앙 정렬) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-full">
                {navLinks.map((link) => {
                    const isActive = location.pathname.startsWith(link.path);
                    const isHome = link.path === '/dashboard';
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2
                                ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}
                                ${isHome && isActive ? 'transform scale-110' : ''}
                            `}
                            aria-label={link.name}
                        >
                            <link.icon size={isHome ? 22: 18} />
                            {!isHome && <span>{link.name}</span>}
            </Link>
                    )
                })}
            </div>
          </div>

          {/* 오른쪽 아이콘 및 사용자 메뉴 */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="relative" ref={notificationRef}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
                aria-label="Notifications"
                onClick={() => setIsNotificationsOpen(prev => !prev)}
              >
                <Bell size={22} />
              </motion.button>
              <AnimatePresence>
                {isNotificationsOpen && <NotificationList onClose={() => setIsNotificationsOpen(false)} />}
              </AnimatePresence>
            </div>

            {/* 프로필 버튼: 클릭 시 바로 /profile 이동 */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/profile')}
              className="flex items-center p-1 rounded-full"
                  aria-label="User profile"
                >
              {avatarUrl ? (
                  <img
                  src={avatarUrl}
                    alt="User avatar"
                  className="w-8 h-8 rounded-full object-cover"
                  />
            ) : (
                <UserCircle2 size={32} className="text-gray-400" />
              )}
                </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;