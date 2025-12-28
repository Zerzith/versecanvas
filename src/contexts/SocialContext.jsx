import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { realtimeDb } from '../lib/firebase';
import { 
  ref, set, get, push, remove, onValue, update, increment 
} from 'firebase/database';

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
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [followers, setFollowers] = useState({});

  // ========== LIKE SYSTEM ==========
  const likePost = async (postId, postType = 'artwork') => {
    if (!currentUser) return false;

    const likeRef = ref(realtimeDb, `likes/${postType}/${postId}/${currentUser.uid}`);
    const countRef = ref(realtimeDb, `likeCounts/${postType}/${postId}`);

    try {
      const snapshot = await get(likeRef);
      
      if (snapshot.exists()) {
        // Unlike
        await remove(likeRef);
        // ตรวจสอบค่าปัจจุบันก่อนลด
        const currentCount = await get(countRef);
        const currentValue = currentCount.exists() ? (currentCount.val().count || 0) : 0;
        if (currentValue > 0) {
          await update(countRef, { count: increment(-1) });
        } else {
          await set(countRef, { count: 0 });
        }
        return false;
      } else {
        // Like
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
      console.error('Error checking like:', error);
      return false;
    }
  };

  const getLikeCount = async (postId, postType = 'artwork') => {
    const countRef = ref(realtimeDb, `likeCounts/${postType}/${postId}`);
    try {
      const snapshot = await get(countRef);
      if (snapshot.exists()) {
        const count = snapshot.val().count || 0;
        // ป้องกันค่าติดลบ
        return Math.max(0, count);
      }
      return 0;
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  };

  // ========== COMMENT SYSTEM ==========
  const addComment = async (postId, postType, text) => {
    if (!currentUser || !text.trim()) return null;

    const commentsRef = ref(realtimeDb, `comments/${postType}/${postId}`);
    const newCommentRef = push(commentsRef);

    const comment = {
      id: newCommentRef.key,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Anonymous',
      userPhoto: currentUser.photoURL || null,
      text: text.trim(),
      timestamp: Date.now(),
      likes: 0
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
      // Check if user owns the comment
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
        const commentsData = snapshot.val();
        return Object.values(commentsData).sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  };

  const subscribeToComments = (postId, postType, callback) => {
    const commentsRef = ref(realtimeDb, `comments/${postType}/${postId}`);
    
    return onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const commentsData = snapshot.val();
        const commentsList = Object.values(commentsData).sort((a, b) => b.timestamp - a.timestamp);
        callback(commentsList);
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
        // Unfollow
        await remove(followRef);
        await remove(followerRef);
        return false;
      } else {
        // Follow
        await set(followRef, {
          userId: targetUserId,
          timestamp: Date.now()
        });
        await set(followerRef, {
          userId: currentUser.uid,
          timestamp: Date.now()
        });
        return true;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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
      console.error('Error checking follow:', error);
      return false;
    }
  };

  const getFollowerCount = async (userId) => {
    const followersRef = ref(realtimeDb, `follows/${userId}/followers`);
    try {
      const snapshot = await get(followersRef);
      return snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  };

  const getFollowingCount = async (userId) => {
    const followingRef = ref(realtimeDb, `follows/${userId}/following`);
    try {
      const snapshot = await get(followingRef);
      return snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    } catch (error) {
      console.error('Error getting following count:', error);
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
      console.error('Error incrementing view:', error);
      return false;
    }
  };

  const getViewCount = async (postId, postType = 'artwork') => {
    const viewRef = ref(realtimeDb, `views/${postType}/${postId}`);
    try {
      const snapshot = await get(viewRef);
      return snapshot.exists() ? snapshot.val().count : 0;
    } catch (error) {
      console.error('Error getting view count:', error);
      return 0;
    }
  };

  // ========== BOOKMARK SYSTEM ==========
  const bookmarkPost = async (postId, postType = 'artwork') => {
    if (!currentUser) return false;

    const bookmarkRef = ref(realtimeDb, `bookmarks/${currentUser.uid}/${postType}/${postId}`);

    try {
      const snapshot = await get(bookmarkRef);
      
      if (snapshot.exists()) {
        // Remove bookmark
        await remove(bookmarkRef);
        return false;
      } else {
        // Add bookmark
        await set(bookmarkRef, {
          postId: postId,
          postType: postType,
          timestamp: Date.now()
        });
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
      console.error('Error checking bookmark:', error);
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
        const bookmarksData = snapshot.val();
        if (postType) {
          return Object.values(bookmarksData).sort((a, b) => b.timestamp - a.timestamp);
        } else {
          // Return all bookmarks from all types
          const allBookmarks = [];
          Object.keys(bookmarksData).forEach(type => {
            Object.values(bookmarksData[type]).forEach(bookmark => {
              allBookmarks.push(bookmark);
            });
          });
          return allBookmarks.sort((a, b) => b.timestamp - a.timestamp);
        }
      }
      return [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  };

  const value = {
    // Like functions
    likePost,
    isLiked,
    getLikeCount,
    
    // Comment functions
    addComment,
    deleteComment,
    getComments,
    subscribeToComments,
    
    // Follow functions
    followUser,
    isFollowing,
    getFollowerCount,
    getFollowingCount,
    
    // Bookmark functions
    bookmarkPost,
    isBookmarked,
    getBookmarks,
    
    // View functions
    incrementView,
    getViewCount
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};
