import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function SocialActions({ postId, postType = 'artwork', onCommentClick }) {
  const { currentUser } = useAuth();
  const { likePost, isLiked, getLikeCount, bookmarkPost, isBookmarked } = useSocial();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      loadSocialData();
    }
  }, [postId, currentUser]);

  const loadSocialData = async () => {
    try {
      const [isLikedResult, count, isBookmarkedResult] = await Promise.all([
        isLiked(postId, postType),
        getLikeCount(postId, postType),
        isBookmarked(postId, postType)
      ]);
      setLiked(isLikedResult);
      setLikeCount(count);
      setBookmarked(isBookmarkedResult);
    } catch (error) {
      console.error("Error loading social data:", error);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อถูกใจ');
      return;
    }

    setLoading(true);
    try {
      const result = await likePost(postId, postType);
      setLiked(result);
      setLikeCount(prev => result ? prev + 1 : Math.max(0, prev - 1));
      if (result) {
        toast.success('ถูกใจแล้ว');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'VerseCanvas',
        text: 'ดูผลงานนี้บน VerseCanvas',
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success('คัดลอกลิงก์แล้ว!');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('คัดลอกลิงก์แล้ว!');
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อบันทึก');
      return;
    }

    setBookmarkLoading(true);
    try {
      const result = await bookmarkPost(postId, postType);
      setBookmarked(result);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
          liked
            ? 'bg-pink-500/20 text-pink-500 shadow-lg shadow-pink-500/10'
            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]'
        }`}
      >
        <Heart
          size={20}
          className={liked ? 'fill-pink-500 animate-pulse' : ''}
        />
        <span className="font-bold">{likeCount}</span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onCommentClick}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a] transition-all duration-300"
      >
        <MessageCircle size={20} />
        <span className="font-bold">แสดงความคิดเห็น</span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a] transition-all duration-300"
      >
        <Share2 size={20} />
      </button>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        disabled={bookmarkLoading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
          bookmarked
            ? 'bg-yellow-500/20 text-yellow-500 shadow-lg shadow-yellow-500/10'
            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]'
        }`}
      >
        <Bookmark
          size={20}
          className={bookmarked ? 'fill-yellow-500' : ''}
        />
      </button>
    </div>
  );
}
