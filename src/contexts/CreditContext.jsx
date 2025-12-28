import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const CreditContext = createContext();

export function useCredit() {
  return useContext(CreditContext);
}

export function CreditProvider({ children }) {
  const { currentUser } = useAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadCredits();
    } else {
      setCredits(0);
      setLoading(false);
    }
  }, [currentUser]);

  const loadCredits = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setCredits(userDoc.data().credits || 0);
      } else {
        // สร้าง document ใหม่ถ้ายังไม่มี
        await setDoc(doc(db, 'users', currentUser.uid), {
          email: currentUser.email,
          credits: 0,
          createdAt: serverTimestamp()
        });
        setCredits(0);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCredits = async (amount, description = 'เติมเครดิต') => {
    if (!currentUser) throw new Error('ต้องเข้าสู่ระบบก่อน');
    
    try {
      // อัปเดตเครดิตใน Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        credits: increment(amount)
      });

      // บันทึกประวัติการทำธุรกรรม
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'credit',
        amount: amount,
        description: description,
        timestamp: serverTimestamp()
      });

      // อัปเดต state
      setCredits(prev => prev + amount);
      
      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      throw error;
    }
  };

  const deductCredits = async (amount, description = 'ซื้อสินค้า') => {
    if (!currentUser) throw new Error('ต้องเข้าสู่ระบบก่อน');
    if (credits < amount) throw new Error('เครดิตไม่เพียงพอ');
    
    try {
      // อัปเดตเครดิตใน Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        credits: increment(-amount)
      });

      // บันทึกประวัติการทำธุรกรรม
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'debit',
        amount: amount,
        description: description,
        timestamp: serverTimestamp()
      });

      // อัปเดต state
      setCredits(prev => prev - amount);
      
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  };

  const transferCredits = async (toUserId, amount, description = 'โอนเครดิต') => {
    if (!currentUser) throw new Error('ต้องเข้าสู่ระบบก่อน');
    if (credits < amount) throw new Error('เครดิตไม่เพียงพอ');
    
    try {
      // หักเครดิตจากผู้ส่ง
      const fromUserRef = doc(db, 'users', currentUser.uid);
      await updateDoc(fromUserRef, {
        credits: increment(-amount)
      });

      // เพิ่มเครดิตให้ผู้รับ
      const toUserRef = doc(db, 'users', toUserId);
      await updateDoc(toUserRef, {
        credits: increment(amount)
      });

      // บันทึกประวัติการทำธุรกรรม (ผู้ส่ง)
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'transfer_out',
        amount: amount,
        toUserId: toUserId,
        description: description,
        timestamp: serverTimestamp()
      });

      // บันทึกประวัติการทำธุรกรรม (ผู้รับ)
      await addDoc(collection(db, 'transactions'), {
        userId: toUserId,
        type: 'transfer_in',
        amount: amount,
        fromUserId: currentUser.uid,
        description: description,
        timestamp: serverTimestamp()
      });

      // ดึงข้อมูลผู้ส่งและผู้รับ
      const fromUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const toUserDoc = await getDoc(doc(db, 'users', toUserId));
      const fromUserName = fromUserDoc.data()?.displayName || 'ผู้ใช้';
      const toUserName = toUserDoc.data()?.displayName || 'ผู้ใช้';

      // สร้างการแจ้งเตือนสำหรับผู้รับ
      await addDoc(collection(db, 'notifications'), {
        userId: toUserId,
        type: 'credit_received',
        title: 'ได้รับเครดิต',
        message: `คุณได้รับ ${amount} เครดิตจาก ${fromUserName}`,
        link: '/transactions',
        read: false,
        createdAt: serverTimestamp()
      });

      // อัปเดต state
      setCredits(prev => prev - amount);
      
      return true;
    } catch (error) {
      console.error('Error transferring credits:', error);
      throw error;
    }
  };

  const getUserCredits = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().credits || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting user credits:', error);
      return 0;
    }
  };

  const value = {
    credits,
    loading,
    addCredits,
    deductCredits,
    transferCredits,
    getUserCredits,
    refreshCredits: loadCredits
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
}
