import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, AlertCircle, Chrome, UserX } from 'lucide-react';

const Login = ({ currentLanguage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const isThaiLanguage = currentLanguage === 'th';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(isThaiLanguage ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(
        isThaiLanguage 
          ? 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน'
          : 'Failed to login. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(
        isThaiLanguage 
          ? 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ'
          : 'Failed to sign in with Google'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInAnonymously();
      navigate('/');
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      setError(
        isThaiLanguage 
          ? 'เข้าสู่ระบบแบบไม่ระบุตัวตนไม่สำเร็จ'
          : 'Failed to sign in anonymously'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="VerseCanvas Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isThaiLanguage ? 'เข้าสู่ระบบ' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400">
              {isThaiLanguage 
                ? 'เข้าสู่ระบบเพื่อดำเนินการต่อ'
                : 'Sign in to continue to VerseCanvas'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {isThaiLanguage ? 'อีเมล' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder={isThaiLanguage ? 'กรอกอีเมล' : 'Enter your email'}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {isThaiLanguage ? 'รหัสผ่าน' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder={isThaiLanguage ? 'กรอกรหัสผ่าน' : 'Enter your password'}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700"
              disabled={loading}
            >
              {loading 
                ? (isThaiLanguage ? 'กำลังเข้าสู่ระบบ...' : 'Signing in...') 
                : (isThaiLanguage ? 'เข้าสู่ระบบ' : 'Sign In')
              }
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[#2a2a2a]"></div>
            <span className="px-4 text-sm text-gray-500">
              {isThaiLanguage ? 'หรือ' : 'OR'}
            </span>
            <div className="flex-1 border-t border-[#2a2a2a]"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 hover:bg-[#0f0f0f]"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Chrome className="w-5 h-5 mr-2" />
              {isThaiLanguage ? 'เข้าสู่ระบบด้วย Google' : 'Sign in with Google'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-2 hover:bg-[#0f0f0f]"
              onClick={handleAnonymousSignIn}
              disabled={loading}
            >
              <UserX className="w-5 h-5 mr-2" />
              {isThaiLanguage ? 'เข้าสู่ระบบแบบไม่ระบุตัวตน' : 'Continue as Guest'}
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isThaiLanguage ? 'ยังไม่มีบัญชี? ' : "Don't have an account? "}
              <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-700">
                {isThaiLanguage ? 'สมัครสมาชิก' : 'Sign up'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

