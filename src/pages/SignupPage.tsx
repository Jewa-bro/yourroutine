import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { User } from '../types'; // User 타입을 정의한 파일 경로에 맞게 수정해주세요.

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null); // 아이디 중복 에러 상태
  const [isUsernameChecked, setIsUsernameChecked] = useState(false); // 아이디 중복 검사 완료 여부

  // 아이디 중복 검사 함수
  const checkUsernameAvailability = async () => {
    if (!username.trim()) {
      setUsernameError('아이디를 입력해주세요.');
      setIsUsernameChecked(false);
      return;
    }
    setLoading(true); // 검사 중 로딩 표시 (선택적)
    setUsernameError(null);
    try {
      const { data, error } = await supabase
        .from('custom_users')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle(); // 결과가 없거나 하나일 수 있음

      if (error && error.code !== 'PGRST116') { // PGRST116: row not found (정상)
        setUsernameError('아이디 중복 검사 중 오류가 발생했습니다.');
        console.error('Username check error:', error);
      } else if (data) {
        setUsernameError('이미 사용 중인 아이디입니다.');
      } else {
        setUsernameError(null); // 사용 가능한 아이디
      }
    } catch (e) {
      setUsernameError('아이디 중복 검사 중 예기치 않은 오류가 발생했습니다.');
      console.error('Unexpected username check error:', e);
    } finally {
      setLoading(false);
      setIsUsernameChecked(true);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // 전체 폼 에러 초기화

    if (usernameError && usernameError !== null) { // 아이디 중복 에러가 있으면 가입 진행 안 함
        setError('아이디 중복 문제를 해결해주세요.');
        return;
    }
    if (!isUsernameChecked && !usernameError) { // 중복검사를 안했고, 에러도 없다면 (아직 입력중)
        // 혹은 여기에 강제로 checkUsernameAvailability()를 호출하고 결과에 따라 진행할 수도 있음
        setError('아이디 중복 확인을 진행해주세요.'); 
        return;
    }

    setLoading(true);
    setError(null);

    if (!username.trim()) {
      setError('아이디를 입력해주세요.');
      setUsernameError('아이디를 입력해주세요.'); // 아이디 필드 에러도 설정
      setLoading(false);
      return;
    }

    try {
      // 1. Supabase auth에 사용자 등록
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { 
            username: username.trim() // username을 options.data에 추가
          }
        }
      });

      if (signUpError) {
        console.error('Supabase signUp Error:', signUpError);
        if (signUpError.message.includes('User already registered')) {
            setError('이미 등록된 이메일입니다.');
        } else if (signUpError.message.includes('Password should be at least 6 characters')) {
            setError('비밀번호는 6자 이상이어야 합니다.');
        } else {
            setError(signUpError.message || '회원가입 중 오류가 발생했습니다.');
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('Supabase signup successful! User ID:', authData.user.id);

        // 데이터베이스 트리거가 custom_users 테이블 생성을 처리할 때까지 잠시 대기 (선택적)
        // 실제로는 트리거가 매우 빠르게 실행되지만, 만약을 위해 짧은 대기를 추가하거나,
        // 또는 setUser 호출 후 fetchInitialData 등을 통해 user_metadata를 최신으로 가져오는 것을 고려할 수 있습니다.
        // 여기서는 일단 바로 진행합니다.

        // setUser 스토어 업데이트 및 로컬 스토리지 저장 (자동 로그인)
        const appUser: User = {
          id: authData.user.id,
          email: authData.user.email,
          user_metadata: { // auth.users.user_metadata에서 username을 가져오도록 기대
            name: authData.user.user_metadata?.username || authData.user.email?.split('@')[0],
            full_name: authData.user.user_metadata?.full_name,
            avatar_url: authData.user.user_metadata?.avatar_url,
            bio: authData.user.user_metadata?.bio,
            ...authData.user.user_metadata, 
          },
          created_at: authData.user.created_at,
        };
        setUser(appUser);
        localStorage.setItem('loggedInUser', JSON.stringify({
            id: appUser.id, 
            email: appUser.email, 
            name: appUser.user_metadata?.name, 
            avatar_url: appUser.user_metadata?.avatar_url
        }));

        // 대시보드로 바로 이동
        navigate('/dashboard', { replace: true });

      } else {
        setError('회원가입에 실패했습니다. 사용자 정보를 받지 못했습니다.');
      }
    } catch (err: any) {
      console.error('회원가입 처리 중 예외 발생:', err);
      setError(err.message || '회원가입 처리 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
            회원가입
          </motion.h2>
          <p className="mt-2 text-sm text-gray-600">
            새로운 계정을 만들어 서비스를 이용해보세요.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">아이디</label>
              <div className="flex rounded-md shadow-sm">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError(null); // 입력 시 에러 메시지 초기화
                    setIsUsernameChecked(false); // 입력 변경 시 중복 검사 다시 필요
                  }}
                  onBlur={checkUsernameAvailability} // 포커스 아웃 시 중복 검사
                  className={`appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${usernameError ? 'border-red-500' : ''} ${!usernameError && isUsernameChecked && username.trim() ? 'border-green-500' : ''}`}
                  placeholder="아이디"
                />
                {/* <button 
                  type="button" 
                  onClick={checkUsernameAvailability} 
                  className="ml-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading || !username.trim()}
                >
                  중복확인
                </button> */}
              </div>
              {usernameError && <p className="mt-1 text-xs text-red-500">{usernameError}</p>}
              {!usernameError && isUsernameChecked && username.trim() && <p className="mt-1 text-xs text-green-500">사용 가능한 아이디입니다.</p>}
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">이메일 주소</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 (6자 이상)"
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
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  가입 중...
                </>
              ) : '가입하기'}
            </button>
          </div>
          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default SignupPage; 