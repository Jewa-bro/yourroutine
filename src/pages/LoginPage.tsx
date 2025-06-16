import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { isLoading, signIn } = useStore(state => ({ isLoading: state.isLoading, signIn: state.signIn }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { data: customUserData, error: customUserError } = await supabase
        .from('custom_users')
        .select('email')
        .eq('username', username)
        .single();

      if (customUserError || !customUserData) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        return;
      }
      const userEmail = customUserData.email;

      if (!userEmail) {
        setError('해당 아이디에 연결된 이메일 정보를 찾을 수 없습니다.');
        return;
      }

      await signIn(password, userEmail);
      // 페이지 이동은 App.tsx의 useEffect가 담당하므로 여기서는 아무것도 하지 않음

    } catch (err: any) {
      console.error('로그인 처리 중 예외 발생:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <motion.div 
      className="flex items-center justify-center min-h-screen bg-slate-100 px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <motion.h2 
            className="mt-6 text-3xl font-extrabold text-gray-900"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            로그인
          </motion.h2>
          <p className="mt-2 text-sm text-gray-600">
            계정에 로그인하여 루틴 관리를 시작하세요.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username-input" className="sr-only">아이디</label>
              <input
                id="username-input"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="아이디"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </>
              ) : '로그인'}
            </button>
          </div>
          <div className="text-sm text-center">
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              계정이 없으신가요? 회원가입
            </Link>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default LoginPage; 