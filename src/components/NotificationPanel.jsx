import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  ShoppingBag, 
  X,
  Check,
  CheckCheck,
  Upload,
  CheckCircle,
  Edit,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, getNotificationMessage } = useNotification();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-orange-500" />;
      
      // Job/Escrow notifications
      case 'job_accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'job_application':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'work_submitted':
      case 'work_submitted_client':
        return <Upload className="w-5 h-5 text-purple-500" />;
      case 'work_approved':
      case 'work_approved_client':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'work_revision_requested':
        return <Edit className="w-5 h-5 text-yellow-500" />;
      case 'escrow_released':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification) => {
    const { type, data } = notification;
    
    // ถ้าไม่มี data หรือ data ไม่ครบ ให้กลับไปหน้าหลัก
    if (!data) return '/';
    
    switch (type) {
      case 'like':
      case 'comment':
        if (!data.contentType || !data.contentId) return '/';
        return data.contentType === 'story' ? `/story/${data.contentId}` : `/artwork/${data.contentId}`;
      case 'follow':
        if (!data.userId) return '/';
        return `/profile/${data.userId}`;
      case 'message':
        if (!data.userId) return '/messages';
        return `/messages?userId=${data.userId}`;
      case 'order':
        return `/orders`;
      
      // Job/Escrow notifications
      case 'job_accepted':
      case 'job_application':
      case 'work_submitted':
      case 'work_submitted_client':
      case 'work_approved':
      case 'work_approved_client':
      case 'work_revision_requested':
      case 'escrow_released':
        return `/escrow`;
      
      default:
        return '/';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl z-50 max-h-[calc(100vh-5rem)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-lg">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition"
                title="อ่านทั้งหมด"
              >
                <CheckCheck className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2a2a2a] rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block p-4 hover:bg-[#2a2a2a] transition ${
                    !notification.read ? 'bg-purple-500/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 mb-1">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatTimestamp(date) {
  if (!date) return '';
  
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 7) return `${days} วันที่แล้ว`;
  
  return date.toLocaleDateString('th-TH', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
