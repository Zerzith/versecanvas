import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  doc,
  serverTimestamp 
} from 'firebase/firestore';

const BookmarkContext = createContext();

export function useBookmark() {
  return useContext(BookmarkContext);
}

export function BookmarkProvider({ children }) {
  const { currentUser } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadBookmarks();
    } else {
      setBookmarks([]);
      setLoading(false);
    }
  }, [currentUser]);

  const loadBookmarks = async () => {
    try {
      const q = query(
        collection(db, 'bookmarks'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const bookmarksList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookmarks(bookmarksList);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (itemId, itemType, itemData = {}) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบเพื่อบันทึก');
      return;
    }

    try {
      // ตรวจสอบว่ามีอยู่แล้วหรือไม่
      const existing = bookmarks.find(
        b => b.itemId === itemId && b.itemType === itemType
      );

      if (existing) {
        // ลบ bookmark
        await deleteDoc(doc(db, 'bookmarks', existing.id));
        setBookmarks(bookmarks.filter(b => b.id !== existing.id));
        return false; // return false = removed
      } else {
        // เพิ่ม bookmark
        const docRef = await addDoc(collection(db, 'bookmarks'), {
          userId: currentUser.uid,
          itemId,
          itemType,
          itemData: {
            title: itemData.title || '',
            image: itemData.image || '',
            author: itemData.author || ''
          },
          createdAt: serverTimestamp()
        });

        const newBookmark = {
          id: docRef.id,
          userId: currentUser.uid,
          itemId,
          itemType,
          itemData,
          createdAt: new Date()
        };

        setBookmarks([...bookmarks, newBookmark]);
        return true; // return true = added
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const isBookmarked = (itemId, itemType) => {
    return bookmarks.some(b => b.itemId === itemId && b.itemType === itemType);
  };

  const getBookmarksByType = (itemType) => {
    return bookmarks.filter(b => b.itemType === itemType);
  };

  const value = {
    bookmarks,
    loading,
    addBookmark,
    isBookmarked,
    getBookmarksByType,
    loadBookmarks
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}
