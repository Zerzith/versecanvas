import { useState, useEffect } from 'react';
import { Send, Trash2, MessageCircle, Clock, X } from 'lucide-react';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export default function CommentSection({ postId, postType = 'artwork', isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { addComment, deleteComment, subscribeToComments } = useSocial();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (isOpen && postId) {
      setIsInitialLoading(true);
      const unsubscribe = subscribeToComments(postId, postType, (commentsList) => {
        setComments(commentsList);
        setIsInitialLoading(false);
      });
      return () => unsubscribe();
    }
  }, [postId, postType, isOpen, subscribeToComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น');
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const success = await addComment(postId, postType, newComment);
      if (success) {
        setNewComment('');
        toast.success('ส่งความคิดเห็นแล้ว');
      } else {
        toast.error('เกิดข้อผิดพลาดในการส่งความคิดเห็น');
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('ต้องการลบความคิดเห็นนี้?')) return;
    
    try {
      const success = await deleteComment(postId, postType, commentId);
      if (success) {
        toast.success('ลบความคิดเห็นแล้ว');
      } else {
        toast.error('ไม่สามารถลบความคิดเห็นได้');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'เมื่อสักครู่';
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true, locale: th });
    } catch (e) {
      return 'เมื่อสักครู่';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
      <div className="bg-[#121212] w-full md:max-w-2xl md:rounded-3xl max-h-[90vh] flex flex-col border border-[#2a2a2a] shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <MessageCircle className="text-purple-500" size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">
              ความคิดเห็น ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">กำลังโหลดความคิดเห็น...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-20 bg-[#1a1a1a]/30 rounded-3xl border border-dashed border-[#2a2a2a]">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">ยังไม่มีความคิดเห็น</p>
              <p className="text-sm">มาเป็นคนแรกที่แสดงความคิดเห็นกัน!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={comment.userPhoto || '/default-avatar.png'}
                    alt={comment.userName}
                    className="w-10 h-10 rounded-full object-cover border border-[#2a2a2a]"
                  />
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] group-hover:border-[#333] transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{comment.userName}</span>
                      {currentUser && comment.userId === currentUser.uid && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-gray-500 hover:text-red-500 transition p-1 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-wrap">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-2">
                    <Clock size={10} className="text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-6 border-t border-[#2a2a2a] bg-[#121212]">
          <div className="flex gap-4 items-start">
            {/* User Avatar */}
            {currentUser && (
              <div className="flex-shrink-0 pt-1">
                <img
                  src={currentUser.photoURL || '/default-avatar.png'}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-[#2a2a2a]"
                />
              </div>
            )}

            {/* Input */}
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? "แสดงความคิดเห็นของคุณ..." : "กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
                disabled={!currentUser || loading}
                rows={1}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-5 py-3 pr-14 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 disabled:opacity-50 resize-none transition min-h-[48px] max-h-[120px]"
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <button
                type="submit"
                disabled={!currentUser || !newComment.trim() || loading}
                className="absolute right-2 bottom-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-xl transition shadow-lg shadow-purple-900/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send size={20} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
