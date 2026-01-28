import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { Home, BookOpen, Palette, Briefcase, Compass, Search, Bell, User, LogOut, Settings, ShoppingBag, MessageCircle, Coins, Package, Receipt, Shield, BarChart3, Menu, X } from 'lucide-react';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const t = {
    th: {
      home: 'หน้าแรก',
      stories: 'นิยาย',
      artworks: 'ผลงาน',
      artseek: 'ตามหา',
      explore: 'สำรวจ',
      shop: 'ร้านค้า',
      login: 'เข้าสู่ระบบ',
      signup: 'สมัครสมาชิก',
      profile: 'โปรไฟล์',
      settings: 'ตั้งค่า',
      logout: 'ออกจากระบบ',
      dashboard: 'แดชบอร์ด',
      orders: 'คำสั่งซื้อ',
      transactions: 'ประวัติธุรกรรม',
      artistJobs: 'งานศิลปิน',
      escrow: 'Escrow',
      withdraw: 'ถอนเงิน'
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
      logout: 'Logout',
      dashboard: 'Dashboard',
      orders: 'Orders',
      transactions: 'Transactions',
      artistJobs: 'Artist Jobs',
      escrow: 'Escrow',
      withdraw: 'Withdraw'
    }
  };

  const navLinks = [
    { to: '/', icon: Home, label: t[lang].home },
    { to: '/stories', icon: BookOpen, label: t[lang].stories },
    { to: '/artworks', icon: Palette, label: t[lang].artworks },
    { to: '/artseek', icon: Briefcase, label: t[lang].artseek },
    { to: '/explore', icon: Compass, label: t[lang].explore },
    { to: '/shop', icon: ShoppingBag, label: t[lang].shop },
  ];

  const userMenuLinks = [
    { to: '/profile', icon: User, label: t[lang].profile },
    { to: '/dashboard', icon: BarChart3, label: t[lang].dashboard },
    { to: '/orders', icon: Package, label: t[lang].orders },
    { to: '/transactions', icon: Receipt, label: t[lang].transactions },
    { to: '/artist-jobs', icon: Briefcase, label: t[lang].artistJobs },
    { to: '/escrow', icon: Shield, label: t[lang].escrow },
    { to: '/withdraw', icon: Coins, label: t[lang].withdraw },
    { to: '/settings', icon: Settings, label: t[lang].settings },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
                >
                  <link.icon size={18} className="flex-shrink-0" />
                  <span className="leading-none">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Icon */}
              <Link
                to="/search"
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
              >
                <Search size={18} className="sm:w-5 sm:h-5" />
              </Link>

              {/* Language Toggle */}
              <button
                onClick={toggleLang}
                className="hidden sm:block px-3 py-1.5 rounded-lg text-sm font-medium bg-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-colors"
              >
                {lang === 'th' ? 'EN' : 'TH'}
              </button>

              {currentUser ? (
                <>
                  {/* Messages - Hidden on mobile */}
                  <Link
                    to="/messages"
                    className="hidden sm:block p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors relative"
                  >
                    <MessageCircle size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
                  </Link>

                  {/* Credits */}
                  <Link
                    to="/credits"
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 transition-all"
                  >
                    <Coins size={14} className="sm:w-4 sm:h-4 text-white" />
                    <span className="text-xs sm:text-sm font-bold text-white">{credits || 0}</span>
                  </Link>

                  {/* Notifications */}
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors relative"
                  >
                    <Bell size={18} className="sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-red-500 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* User Menu - Desktop */}
                  <div className="hidden md:block relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                    >
                      <UserAvatar 
                        userId={currentUser.uid} 
                        className="w-8 h-8" 
                        showName={true} 
                        nameClassName="text-sm text-gray-300 hidden lg:block"
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
                          <p className="text-xs text-gray-400 mt-1">
                            {currentUser?.email || 'Anonymous'}
                          </p>
                        </div>
                        {userMenuLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <link.icon size={18} />
                            <span>{link.label}</span>
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-[#2a2a2a] hover:text-red-300 transition-colors border-t border-[#2a2a2a]"
                        >
                          <LogOut size={18} />
                          <span>{t[lang].logout}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                  >
                    {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t[lang].login}
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {t[lang].signup}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && currentUser && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeMobileMenu}
          ></div>
          <div className="absolute top-14 left-0 right-0 bottom-0 bg-[#1a1a1a] border-t border-[#2a2a2a] overflow-y-auto">
            {/* User Info */}
            <div className="p-4 border-b border-[#2a2a2a]">
              <UserAvatar 
                userId={currentUser.uid} 
                showName={true} 
                className="w-12 h-12"
                nameClassName="text-base font-medium text-white"
              />
              <p className="text-sm text-gray-400 mt-2">
                {currentUser?.email || 'Anonymous'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Coins size={16} className="text-yellow-500" />
                <span className="text-sm font-bold text-white">{credits || 0} Credits</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-4 py-2">เมนูหลัก</div>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors rounded-lg"
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* User Menu Links */}
            <div className="p-2 border-t border-[#2a2a2a]">
              <div className="text-xs font-semibold text-gray-500 px-4 py-2">บัญชี</div>
              {userMenuLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors rounded-lg"
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Language & Logout */}
            <div className="p-2 border-t border-[#2a2a2a]">
              <button
                onClick={toggleLang}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors rounded-lg"
              >
                <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">
                  {lang === 'th' ? 'EN' : 'TH'}
                </span>
                <span>เปลี่ยนภาษา</span>
              </button>
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-[#2a2a2a] hover:text-red-300 transition-colors rounded-lg"
              >
                <LogOut size={20} />
                <span>{t[lang].logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
}
