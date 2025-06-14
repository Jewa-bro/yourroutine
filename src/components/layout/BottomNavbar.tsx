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
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.08)] z-[100] lg:hidden transform-gpu">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-4">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          const isHome = link.path === '/dashboard';

          if (isHome) {
            return (
              <Link key={link.name} to={link.path} className="relative -top-6">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-primary-500 text-white shadow-lg' : 'bg-white text-gray-500 shadow-md'}`
                  }
                >
                  <link.icon size={30} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200
                ${isActive ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'}`
              }
            >
              <link.icon size={22} />
              <span className="text-xs font-medium">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar; 