import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWrapper from './App'
import './index.css'

// Vite 환경 변수 테스트 로그
console.log('[main.tsx] VITE_TEST_VARIABLE:', import.meta.env.VITE_TEST_VARIABLE);
console.log('[main.tsx] All env vars:', import.meta.env); // 전체 환경 변수 객체도 확인

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
