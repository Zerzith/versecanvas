import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function UserAvatar({ userId, className = "w-10 h-10", showName = false, nameClassName = "font-bold text-white text-sm" }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className={`${className} rounded-full bg-[#2a2a2a] animate-pulse`}></div>
        {showName && <div className="h-4 w-20 bg-[#2a2a2a] animate-pulse rounded"></div>}
      </div>
    );
  }

  const displayName = profile?.displayName || 'Anonymous';
  
  // Generate random avatar based on userId
  const getDefaultAvatar = (userId) => {
    if (!userId) return '/default-avatar-1.png';
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const avatarNumber = (hash % 3) + 1;
    return `/default-avatar-${avatarNumber}.png`;
  };
  
  const photoURL = profile?.photoURL || getDefaultAvatar(userId);

  return (
    <div className="flex items-center gap-3">
      <img
        src={photoURL}
        alt={displayName}
        className={`${className} rounded-full object-cover border border-[#2a2a2a]`}
        onError={(e) => {
          e.target.src = '/default-avatar.png';
        }}
      />
      {showName && <span className={nameClassName}>{displayName}</span>}
    </div>
  );
}
