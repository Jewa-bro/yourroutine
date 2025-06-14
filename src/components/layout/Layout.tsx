import React, { useState } from 'react';
import Navbar from './Navbar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, PanInfo } from 'framer-motion';
import BottomNavbar from './BottomNavbar';

const pages = ['/routines', '/dashboard', '/calendar'];

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
    const power = swipePower(offset.x, velocity.x);

    if (power < -swipeThreshold) {
      // Swipe left
      const currentIndex = pages.indexOf(location.pathname);
      if (currentIndex < pages.length - 1 && currentIndex !== -1) {
        navigate(pages[currentIndex + 1]);
      }
    } else if (power > swipeThreshold) {
      // Swipe right
      const currentIndex = pages.indexOf(location.pathname);
      if (currentIndex > 0) {
        navigate(pages[currentIndex - 1]);
      }
    }
  };
  
  // 현재 페이지가 스와이프 가능한 페이지인지 확인
  const isSwipeablePage = pages.includes(location.pathname);

  return (
    <div className="h-full w-full flex flex-col">
      <Navbar />
      
      <motion.main
        className="flex-1 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 overflow-y-auto overscroll-contain"
        drag={isSwipeablePage ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
      >
        <Outlet />
      </motion.main>
      
      <BottomNavbar />
    </div>
  );
};

export default Layout;