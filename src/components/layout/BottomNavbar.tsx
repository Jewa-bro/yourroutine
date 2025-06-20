import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ListChecks, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const navLinks = [
  { name: '루틴', path: '/routines', icon: ListChecks },
  { name: '홈', path: '/dashboard', icon: Home },
  { name: '캘린더', path: '/calendar', icon: CalendarDays },
];

const BottomNavbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.08)] z-[100] lg:hidden will-change-transform">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          const isHome = link.path === '/dashboard';

          if (isHome) {
            return (
              <Link key={link.name} to={link.path} className="relative -top-3">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-primary-500 text-white shadow-lg' : 'bg-white text-gray-500 shadow-md'}`
                  }
                >
                  <link.icon size={24} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center justify-center space-y-0.5 transition-colors duration-200
                ${isActive ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'}`
              }
            >
              <link.icon size={18} />
              <span className="text-xs font-medium leading-none">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar; 