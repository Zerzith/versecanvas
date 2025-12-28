import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Subscribe to notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const createNotification = async (userId, type, data) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        type, // 'like', 'comment', 'follow', 'message', 'order', 'job_accepted', 'work_submitted', 'work_approved', 'work_revision', 'escrow_released', 'system'
        data,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => 
          updateDoc(doc(db, 'notifications', n.id), { read: true })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, data } = notification;
    
    // ตรวจสอบ data ก่อนใช้งาน
    if (!data) {
      return 'คุณมีการแจ้งเตือนใหม่';
    }
    
    switch (type) {
      case 'like':
        return `${data.userName || 'ผู้ใช้'} ถูกใจ${data.contentType === 'story' ? 'นิยาย' : 'ผลงาน'}ของคุณ`;
      case 'comment':
        return `${data.userName || 'ผู้ใช้'} แสดงความคิดเห็นใน${data.contentType === 'story' ? 'นิยาย' : 'ผลงาน'}ของคุณ`;
      case 'follow':
        return `${data.userName || 'ผู้ใช้'} เริ่มติดตามคุณ`;
      case 'message':
        return `${data.userName || 'ผู้ใช้'} ส่งข้อความถึงคุณ`;
      case 'order':
        return `คำสั่งซื้อ #${data.orderId || 'N/A'} ${data.status || ''}`;
      
      // Job/Escrow notifications - สำหรับลูกค้า
      case 'job_accepted':
        return `${data.artistName || 'ศิลปิน'} รับงาน "${data.jobTitle || 'งาน'}" แล้ว`;
      case 'work_submitted':
        return `${data.artistName || 'ศิลปิน'} ส่งงาน "${data.jobTitle || 'งาน'}" แล้ว กรุณาตรวจสอบ`;
      case 'work_revision_requested':
        return `ลูกค้าขอแก้ไขงาน "${data.jobTitle || 'งาน'}" - ${data.revisionNote || 'ไม่ระบุรายละเอียด'}`;
      case 'work_approved':
        return `ลูกค้ายืนยันงาน "${data.jobTitle || 'งาน'}" แล้ว คุณได้รับ ${data.amount || 0} เครดิต`;
      case 'escrow_released':
        return `เงินจากงาน "${data.jobTitle || 'งาน'}" ถูกปล่อยแล้ว จำนวน ${data.amount || 0} เครดิต`;
      
      // Job/Escrow notifications - สำหรับศิลปิน
      case 'job_application':
        return `${data.artistName || 'ศิลปิน'} สมัครรับงาน "${data.jobTitle || 'งาน'}"`;
      case 'work_approved_client':
        return `คุณยืนยันงาน "${data.jobTitle || 'งาน'}" แล้ว สามารถดาวน์โหลดไฟล์ได้`;
      case 'work_submitted_client':
        return `ศิลปินส่งงาน "${data.jobTitle || 'งาน'}" แล้ว กรุณาตรวจสอบและยืนยัน`;
      
      case 'system':
        return data.message || 'การแจ้งเตือนจากระบบ';
      default:
        return 'คุณมีการแจ้งเตือนใหม่';
    }
  };

  const getNotificationIcon = (type) => {
    // ใช้ใน NotificationPanel
    const iconMap = {
      'like': 'heart',
      'comment': 'message',
      'follow': 'user-plus',
      'message': 'message-circle',
      'order': 'shopping-bag',
      'job_accepted': 'check-circle',
      'work_submitted': 'upload',
      'work_approved': 'check-circle',
      'work_revision_requested': 'edit',
      'escrow_released': 'dollar-sign',
      'system': 'bell'
    };
    return iconMap[type] || 'bell';
  };

  const value = {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    getNotificationMessage,
    getNotificationIcon
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
