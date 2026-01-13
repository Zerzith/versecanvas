import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, DollarSign, AlertCircle, 
  Settings, BarChart3, Home, Menu, X
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
    { path: '/admin/content', icon: BookOpen, label: 'จัดการเนื้อหา' },
    { path: '/admin/transactions', icon: DollarSign, label: 'ธุรกรรม' },
    { path: '/admin/withdrawals', icon: DollarSign, label: 'อนุมัติถอนเงิน' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/settings', icon: Settings, label: 'ตั้งค่า' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-20 left-4 z-50 md:hidden p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-600 rounded-lg">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Panel</h2>
              <p className="text-xs text-gray-400">Versecanvas</p>
            </div>
          </div>

          <nav className="space-y-2">
            {/* Back to Home */}
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
            >
              <Home size={20} />
              <span>กลับหน้าแรก</span>
            </Link>

            <div className="border-t border-[#2a2a2a] my-4"></div>

            {/* Admin Menu Items */}
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="md:ml-64">
        {children}
      </main>
    </div>
  );
}
