import React from 'react';
import Navbar from './Navbar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, PanInfo } from 'framer-motion';
import BottomNavbar from './BottomNavbar';

interface LayoutProps {
  handleSignOut: () => void;
}

const pages = ['/routines', '/dashboard', '/calendar'];

const Layout: React.FC<LayoutProps> = ({ handleSignOut }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 100; // 스와이프 민감도 조절
    const swipePower = Math.abs(offset.x) * velocity.x;

    if (swipePower < -swipeThreshold) { // Swipe Left
      const currentIndex = pages.indexOf(location.pathname);
      if (currentIndex < pages.length - 1 && currentIndex !== -1) {
        navigate(pages[currentIndex + 1]);
      }
    } else if (swipePower > swipeThreshold) { // Swipe Right
      const currentIndex = pages.indexOf(location.pathname);
      if (currentIndex > 0) {
        navigate(pages[currentIndex - 1]);
      }
    }
  };
  
  const isSwipeablePage = pages.includes(location.pathname);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Navbar handleSignOut={handleSignOut} />
      
      <motion.main
        key={location.pathname} // 페이지 전환 시 애니메이션을 위해 key 추가
        className="flex-1 overflow-y-auto"
        drag={isSwipeablePage ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={onDragEnd}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
            <Outlet />
        </div>
      </motion.main>
      
      <BottomNavbar />
    </div>
  );
};

export default Layout;