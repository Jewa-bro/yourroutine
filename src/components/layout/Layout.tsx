import React from 'react';
import Navbar from './Navbar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import BottomNavbar from './BottomNavbar';

const pages = ['/routines', '/dashboard', '/calendar'];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [direction, setDirection] = React.useState(0);
  
  const currentIndex = pages.indexOf(location.pathname);

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const swipePower = Math.abs(offset.x) * velocity.x;

    if (swipePower < -swipeThreshold) { // Swipe Left
      if (currentIndex < pages.length - 1) {
        setDirection(1);
        navigate(pages[currentIndex + 1]);
      }
    } else if (swipePower > swipeThreshold) { // Swipe Right
      if (currentIndex > 0) {
        setDirection(-1);
        navigate(pages[currentIndex - 1]);
      }
    }
  };
  
  const isSwipeablePage = pages.includes(location.pathname);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <Navbar />
      
      <div className="flex-1 relative flex flex-col">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={location.pathname}
            className="absolute top-0 left-0 w-full h-full"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag={isSwipeablePage ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={onDragEnd}
          >
            <main className="h-full overflow-y-auto">
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
                <Outlet />
              </div>
            </main>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <BottomNavbar />
    </div>
  );
};

export default Layout;