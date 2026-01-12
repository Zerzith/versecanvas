import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { Home, BookOpen, Palette, Briefcase, Compass, Search, Bell, User, LogOut, Settings, ShoppingBag, MessageCircle, Coins, Package, Receipt, FileText, Shield, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';
import UserAvatar from './UserAvatar';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const { credits } = useCredit();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lang, setLang] = useState('th');
  const { unreadCount } = useNotification();

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
      stories: 'นิยาย',
      artworks: 'ผลงาน',
      artseek: 'Artseek',
      explore: 'สำรวจ',
      shop: 'ร้านค้า',
      artRequests: 'คำขอ',
      orders: 'คำสั่งซื้อ',
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
      artRequests: 'Requests',
      orders: 'Orders',
      login: 'Login',
      signup: 'Sign Up',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout'
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#2a2a2a]">
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo - ลบชื่อเว็บออก */}
          <Link to="/" className="flex items-center group">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
            />
          </Link>

          {/* Navigation Links - เพิ่ม spacing และแก้ alignment */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 xl:gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
            >
              <Home size={18} className="flex-shrink-0" />
              <span className="leading-none">{t[lang].home}</span>
            </Link>
            <Link
              to="/stories"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
            >
              <BookOpen size={18} className="flex-shrink-0" />
              <span className="leading-none">{t[lang].stories}</span>
            </Link>
            <Link
              to="/artworks"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
            >
              <Palette size={18} className="flex-shrink-0" />
              <span className="leading-none">{t[lang].artworks}</span>
            </Link>
            <Link
              to="/artseek"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
            >
              <Briefcase size={18} className="flex-shrink-0" />
              <span className="leading-none">{t[lang].artseek}</span>
            </Link>
            <Link
              to="/explore"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
            >
              <Compass size={18} className="flex-shrink-0" />
              <span className="leading-none">{t[lang].explore}</span>
            </Link>
            <Link
              to="/shop"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
            >
              <ShoppingBag size={18} className="flex-shrink-0" />
              <span className="leading-none">{t[lang].shop}</span>
            </Link>

          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Search Icon */}
            <Link
              to="/search"
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <Search size={20} />
            </Link>

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
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                  >
                    <UserAvatar 
                      userId={currentUser.uid} 
                      className="w-8 h-8" 
                      showName={true} 
                      nameClassName="text-sm text-gray-300 hidden sm:block"
                    />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden animate-scale-in">
                      <div className="p-4 border-b border-[#2a2a2a]">
                        <UserAvatar 
                          userId={currentUser.uid} 
                          showName={true} 
                          className="w-10 h-10"
                          nameClassName="text-sm font-medium text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1 ml-13">
                          {currentUser?.email || 'Anonymous'}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={18} />
                        <span>{t[lang].profile}</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <BarChart3 size={18} />
                        <span>แดชบอร์ด</span>
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} />
                        <span>{t[lang].orders}</span>
                      </Link>
                      <Link
                        to="/transactions"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Receipt size={18} />
                        <span>ประวัติธุรกรรม</span>
                      </Link>
                      <Link
                        to="/artist-jobs"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Briefcase size={18} />
                        <span>งานศิลปิน</span>
                      </Link>
                      <Link
                        to="/escrow"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield size={18} />
                        <span>Escrow</span>
                      </Link>
                      <Link
                        to="/withdraw"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Coins size={18} />
                        <span>ถอนเงิน</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} />
                        <span>{t[lang].settings}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-pink-400 hover:bg-[#2a2a2a] hover:text-pink-300 transition-colors"
                      >
                        <LogOut size={18} />
                        <span>{t[lang].logout}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
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
        <Link to="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
          <Home size={20} />
          <span className="text-xs">{t[lang].home}</span>
        </Link>
        <Link to="/stories" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
          <BookOpen size={20} />
          <span className="text-xs">{t[lang].stories}</span>
        </Link>
        <Link to="/artworks" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
          <Palette size={20} />
          <span className="text-xs">{t[lang].artworks}</span>
        </Link>
        <Link to="/artseek" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
          <Briefcase size={20} />
          <span className="text-xs">{t[lang].artseek}</span>
        </Link>
        <Link to="/art-requests" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
          <FileText size={20} />
          <span className="text-xs">{t[lang].artRequests}</span>
        </Link>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </nav>
  );
}
