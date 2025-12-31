import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { realtimeDb } from '../lib/firebase';
import { 
  ref, set, get, push, remove, onValue, update, increment 
} from 'firebase/database';
import { toast } from 'react-hot-toast';

const SocialContext = createContext();

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within SocialProvider');
  }
  return context;
};

export const SocialProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // ========== LIKE SYSTEM ==========
  const likePost = async (postId, postType = 'artwork') => {
    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อถูกใจ');
      return false;
    }

    const likeRef = ref(realtimeDb, `likes/${postType}/${postId}/${currentUser.uid}`);
    const countRef = ref(realtimeDb, `likeCounts/${postType}/${postId}`);

    try {
      const snapshot = await get(likeRef);
      
      if (snapshot.exists()) {
        await remove(likeRef);
        const currentCount = await get(countRef);
        const currentValue = currentCount.exists() ? (currentCount.val().count || 0) : 0;
        await update(countRef, { count: Math.max(0, currentValue - 1) });
        return false;
      } else {
        await set(likeRef, {
          userId: currentUser.uid,
          timestamp: Date.now()
        });
        await update(countRef, { count: increment(1) });
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return false;
    }
  };

  const isLiked = async (postId, postType = 'artwork') => {
    if (!currentUser) return false;
    const likeRef = ref(realtimeDb, `likes/${postType}/${postId}/${currentUser.uid}`);
    try {
      const snapshot = await get(likeRef);
      return snapshot.exists();
    } catch (error) {
      return false;
    }
  };

  const getLikeCount = async (postId, postType = 'artwork') => {
    const countRef = ref(realtimeDb, `likeCounts/${postType}/${postId}`);
    try {
      const snapshot = await get(countRef);
      return snapshot.exists() ? Math.max(0, snapshot.val().count || 0) : 0;
    } catch (error) {
      return 0;
    }
  };

  // ========== COMMENT SYSTEM ==========
  const addComment = async (postId, postType, text) => {
    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น');
      return null;
    }
    if (!text.trim()) return null;

    const commentsRef = ref(realtimeDb, `comments/${postType}/${postId}`);
    const newCommentRef = push(commentsRef);

    const comment = {
      id: newCommentRef.key,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Anonymous',
      userPhoto: currentUser.photoURL || null,
      text: text.trim(),
      timestamp: Date.now()
    };

    try {
      await set(newCommentRef, comment);
      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  };

  const deleteComment = async (postId, postType, commentId) => {
    if (!currentUser) return false;

    const commentRef = ref(realtimeDb, `comments/${postType}/${postId}/${commentId}`);
    try {
      const snapshot = await get(commentRef);
      if (snapshot.exists() && snapshot.val().userId === currentUser.uid) {
        await remove(commentRef);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  const getComments = async (postId, postType = 'artwork') => {
    const commentsRef = ref(realtimeDb, `comments/${postType}/${postId}`);
    try {
      const snapshot = await get(commentsRef);
      if (snapshot.exists()) {
        return Object.values(snapshot.val()).sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const subscribeToComments = (postId, postType, callback) => {
    const commentsRef = ref(realtimeDb, `comments/${postType}/${postId}`);
    return onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(Object.values(snapshot.val()).sort((a, b) => b.timestamp - a.timestamp));
      } else {
        callback([]);
      }
    });
  };

  // ========== FOLLOW SYSTEM ==========
  const followUser = async (targetUserId) => {
    if (!currentUser || currentUser.uid === targetUserId) return false;
    const followRef = ref(realtimeDb, `follows/${currentUser.uid}/following/${targetUserId}`);
    const followerRef = ref(realtimeDb, `follows/${targetUserId}/followers/${currentUser.uid}`);

    try {
      const snapshot = await get(followRef);
      if (snapshot.exists()) {
        await remove(followRef);
        await remove(followerRef);
        return false;
      } else {
        await set(followRef, { userId: targetUserId, timestamp: Date.now() });
        await set(followerRef, { userId: currentUser.uid, timestamp: Date.now() });
        return true;
      }
    } catch (error) {
      return false;
    }
  };

  const isFollowing = async (targetUserId) => {
    if (!currentUser) return false;
    const followRef = ref(realtimeDb, `follows/${currentUser.uid}/following/${targetUserId}`);
    try {
      const snapshot = await get(followRef);
      return snapshot.exists();
    } catch (error) {
      return false;
    }
  };

  const getFollowerCount = async (userId) => {
    const followersRef = ref(realtimeDb, `follows/${userId}/followers`);
    try {
      const snapshot = await get(followersRef);
      return snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    } catch (error) {
      return 0;
    }
  };

  const getFollowingCount = async (userId) => {
    const followingRef = ref(realtimeDb, `follows/${userId}/following`);
    try {
      const snapshot = await get(followingRef);
      return snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    } catch (error) {
      return 0;
    }
  };

  // ========== VIEW SYSTEM ==========
  const incrementView = async (postId, postType = 'artwork') => {
    const viewRef = ref(realtimeDb, `views/${postType}/${postId}`);
    try {
      await update(viewRef, { count: increment(1) });
      return true;
    } catch (error) {
      return false;
    }
  };

  const getViewCount = async (postId, postType = 'artwork') => {
    const viewRef = ref(realtimeDb, `views/${postType}/${postId}`);
    try {
      const snapshot = await get(viewRef);
      return snapshot.exists() ? snapshot.val().count : 0;
    } catch (error) {
      return 0;
    }
  };

  // ========== BOOKMARK SYSTEM ==========
  const bookmarkPost = async (postId, postType = 'artwork', postData = {}) => {
    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อบันทึก');
      return false;
    }
    const bookmarkRef = ref(realtimeDb, `bookmarks/${currentUser.uid}/${postType}/${postId}`);

    try {
      const snapshot = await get(bookmarkRef);
      if (snapshot.exists()) {
        await remove(bookmarkRef);
        toast.success('ลบออกจากรายการบันทึกแล้ว');
        return false;
      } else {
        await set(bookmarkRef, {
          postId,
          postType,
          ...postData,
          timestamp: Date.now()
        });
        toast.success('บันทึกเรียบร้อยแล้ว');
        return true;
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return false;
    }
  };

  const isBookmarked = async (postId, postType = 'artwork') => {
    if (!currentUser) return false;
    const bookmarkRef = ref(realtimeDb, `bookmarks/${currentUser.uid}/${postType}/${postId}`);
    try {
      const snapshot = await get(bookmarkRef);
      return snapshot.exists();
    } catch (error) {
      return false;
    }
  };

  const getBookmarks = async (postType = null) => {
    if (!currentUser) return [];
    const bookmarksRef = postType 
      ? ref(realtimeDb, `bookmarks/${currentUser.uid}/${postType}`)
      : ref(realtimeDb, `bookmarks/${currentUser.uid}`);
    
    try {
      const snapshot = await get(bookmarksRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (postType) {
          return Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        } else {
          const all = [];
          Object.keys(data).forEach(type => {
            Object.values(data[type]).forEach(b => all.push(b));
          });
          return all.sort((a, b) => b.timestamp - a.timestamp);
        }
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const value = {
    likePost, isLiked, getLikeCount,
    addComment, deleteComment, getComments, subscribeToComments,
    followUser, isFollowing, getFollowerCount, getFollowingCount,
    bookmarkPost, isBookmarked, getBookmarks,
    incrementView, getViewCount
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};
