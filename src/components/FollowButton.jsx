import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';

export default function FollowButton({ targetUserId, className = '', showProfileLink = false }) {
  const { currentUser } = useAuth();
  const { followUser, isFollowing } = useSocial();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFollowStatus();
  }, [targetUserId, currentUser]);

  const loadFollowStatus = async () => {
    if (currentUser && targetUserId) {
      const status = await isFollowing(targetUserId);
      setFollowing(status);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบเพื่อติดตาม');
      return;
    }

    if (!targetUserId) {
      console.error('targetUserId is undefined');
      alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลผู้ใช้');
      return;
    }

    if (currentUser.uid === targetUserId) {
      alert('ไม่สามารถติดตามตัวเองได้');
      return;
    }

    if (showProfileLink) {
      navigate(`/profile/${targetUserId}`);
      return;
    }

    setLoading(true);
    const result = await followUser(targetUserId);
    setFollowing(result);
    setLoading(false);
  };

  if (!currentUser || !targetUserId || currentUser.uid === targetUserId) {
    return null;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition ${
        following
          ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
          : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
      } ${className}`}
    >
      {following ? (
        <>
          <UserCheck size={18} />
          <span>กำลังติดตาม</span>
        </>
      ) : (
        <>
          <UserPlus size={18} />
          <span>ติดตาม</span>
        </>
      )}
    </button>
  );
}
