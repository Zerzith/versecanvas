import { useState, useEffect } from 'react';
import { Send, Trash2, Heart, MessageCircle } from 'lucide-react';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';

export default function CommentSection({ postId, postType = 'artwork', isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { addComment, deleteComment, subscribeToComments } = useSocial();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeToComments(postId, postType, (commentsList) => {
        setComments(commentsList);
      });
      return () => unsubscribe();
    }
  }, [postId, postType, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น');
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    await addComment(postId, postType, newComment);
    setNewComment('');
    setLoading(false);
  };

  const handleDelete = async (commentId) => {
    if (confirm('ต้องการลบความคิดเห็นนี้?')) {
      await deleteComment(postId, postType, commentId);
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
    return new Date(timestamp).toLocaleDateString('th-TH');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-[#1a1a1a] w-full md:max-w-2xl md:rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h3 className="text-xl font-bold text-white">
            ความคิดเห็น ({comments.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีความคิดเห็น</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 py-2">
                {/* Avatar - ลดขนาด */}
                <div className="flex-shrink-0">
                  {comment.userPhoto ? (
                    <img
                      src={comment.userPhoto}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {comment.userName[0]}
                    </div>
                  )}
                </div>

                {/* Comment Content - กระชับขึ้น */}
                <div className="flex-1 min-w-0">
                  <div className="bg-[#2a2a2a] rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white text-sm">{comment.userName}</span>
                      {currentUser && comment.userId === currentUser.uid && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm break-words">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-2">
                    <span className="text-xs text-gray-500">{formatTime(comment.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-[#2a2a2a]">
          <div className="flex gap-3">
            {/* User Avatar */}
            {currentUser && (
              <div className="flex-shrink-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? "แสดงความคิดเห็น..." : "เข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
                disabled={!currentUser || loading}
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-full px-4 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!currentUser || !newComment.trim() || loading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full transition"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
