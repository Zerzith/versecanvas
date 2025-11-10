import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { Home, BookOpen, Palette, Briefcase, Compass, Search, Bell, User, LogOut, Settings, ShoppingBag, MessageCircle, Coins } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const { credits } = useCredit();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [lang, setLang] = useState('th');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'th' ? 'en' : 'th');
  };

  const t = {
    th: {
      home: 'หน้าแรก',
      stories: 'เรื่องราว',
      artworks: 'งานศิลปะ',
      artseek: 'Artseek',
      explore: 'สำรวจ',
      shop: 'ร้านค้า',
      login: 'เข้าสู่ระบบ',
      signup: 'สมัครสมาชิก',
      profile: 'โปรไฟล์',
      settings: 'ตั้งค่า',
      logout: 'ออกจากระบบ'
    },
    en: {
      home: 'Home',
      stories: 'Stories',
      artworks: 'Artworks',
      artseek: 'Artseek',
      explore: 'Explore',
      shop: 'Shop',
      login: 'Login',
      signup: 'Sign Up',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout'
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logo.png" 
              alt="VerseCanvas Logo" 
              className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-bold gradient-text hidden sm:block">
              VerseCanvas
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <Home size={18} />
              <span>{t[lang].home}</span>
            </Link>
            <Link
              to="/stories"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <BookOpen size={18} />
              <span>{t[lang].stories}</span>
            </Link>

            <Link
              to="/artseek"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <Briefcase size={18} />
              <span>{t[lang].artseek}</span>
            </Link>
            <Link
              to="/explore"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <Compass size={18} />
              <span>{t[lang].explore}</span>
            </Link>
            <Link
              to="/shop"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <ShoppingBag size={18} />
              <span>{t[lang].shop}</span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Search Icon */}
            <button className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors">
              <Search size={20} />
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-colors"
            >
              {lang === 'th' ? 'EN' : 'TH'}
            </button>

            {currentUser ? (
              <>
                {/* Messages */}
                <Link
                  to="/messages"
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors relative"
                >
                  <MessageCircle size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
                </Link>

                {/* Credits */}
                <Link
                  to="/credits"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 transition-all"
                >
                  <Coins size={16} className="text-white" />
                  <span className="text-sm font-bold text-white">{credits || 0}</span>
                </Link>

                {/* Notifications */}
                <button 
                  onClick={() => alert('ระบบแจ้งเตือนจะพัฒนาในเวอร์ชั่นถัดไป')}
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors relative"
                >
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center overflow-hidden">
                      {userProfile?.photoURL || currentUser?.photoURL ? (
                        <img 
                          src={userProfile?.photoURL || currentUser?.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <User size={18} className="text-white" style={{ display: (userProfile?.photoURL || currentUser?.photoURL) ? 'none' : 'block' }} />
                    </div>
                    <span className="text-sm text-gray-300 hidden sm:block">
                      {userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'User'}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden animate-scale-in">
                      <div className="p-4 border-b border-[#2a2a2a]">
                        <p className="text-sm font-medium text-white">
                          {userProfile?.displayName || currentUser?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {currentUser?.email || 'Anonymous'}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={18} />
                        <span>{t[lang].profile}</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} />
                        <span>{t[lang].settings}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-pink-400 hover:bg-[#2a2a2a] hover:text-pink-300 transition-colors"
                      >
                        <LogOut size={18} />
                        <span>{t[lang].logout}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  {t[lang].login}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-colors"
                >
                  {t[lang].signup}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-around">
        <Link to="/" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white">
          <Home size={20} />
          <span className="text-xs">{t[lang].home}</span>
        </Link>
        <Link to="/stories" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white">
          <BookOpen size={20} />
          <span className="text-xs">{t[lang].stories}</span>
        </Link>
        <Link to="/artworks" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white">
          <Palette size={20} />
          <span className="text-xs">{t[lang].artworks}</span>
        </Link>
        <Link to="/artseek" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white">
          <Briefcase size={20} />
          <span className="text-xs">{t[lang].artseek}</span>
        </Link>
        <Link to="/explore" className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white">
          <Compass size={20} />
          <span className="text-xs">{t[lang].explore}</span>
        </Link>
      </div>
    </nav>
  );
}

