import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Eye, Heart, Clock, User, ChevronRight, MessageCircle, Share2, Bookmark, Edit, Plus, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import SocialActions from '../components/SocialActions';
import CommentSection from '../components/CommentSection';
import FollowButton from '../components/FollowButton';
import UserAvatar from '../components/UserAvatar';
import { collection, query, orderBy, getDocs, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const StoryDetail = () => {
  const { storyId } = useParams();
  const { currentUser } = useAuth();
  const { incrementView, getViewCount, getLikeCount, bookmarkPost, isBookmarked } = useSocial();
  const [bookmarked, setBookmarked] = useState(false);
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchStoryDetail();
    // Increment view count when story is opened
    incrementView(storyId, 'story');
  }, [storyId]);

  useEffect(() => {
    if (storyId) {
      loadCounts();
      checkBookmarkStatus();
    }
  }, [storyId, currentUser]);

  const checkBookmarkStatus = async () => {
    if (currentUser && storyId) {
      const status = await isBookmarked(storyId);
      setBookmarked(status);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return;
    const result = await bookmarkPost(storyId, 'story', {
      title: story.title,
      coverImage: story.coverImage,
      authorId: story.authorId
    });
    setBookmarked(result);
  };

  const loadCounts = async () => {
    const views = await getViewCount(storyId, 'story');
    const likes = await getLikeCount(storyId, 'story');
    setViewCount(views);
    setLikeCount(likes);
  };

  const fetchStoryDetail = async () => {
    setLoading(true);
    try {
      // Fetch story from Firebase
      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (storyDoc.exists()) {
        setStory({ id: storyDoc.id, ...storyDoc.data() });
      }
      // Fetch chapters from Firebase
      const chaptersQuery = query(
        collection(db, 'stories', storyId, 'chapters'),
        orderBy('number', 'asc')
      );
      const chaptersSnapshot = await getDocs(chaptersQuery);
      const chaptersData = chaptersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error fetching story:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    // Scroll to top when opening a chapter
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (date) => {
    if (!date) return 'ไม่ระบุวันที่';
    try {
      const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return format(d, 'd MMMM yyyy', { locale: th });
    } catch (e) {
      return 'ไม่ระบุวันที่';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">ไม่พบนิยาย</p>
        </div>
      </div>
    );
  }

  // If chapter is selected, show chapter reading view
  if (selectedChapter) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedChapter(null)}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-purple-400 transition"
          >
            ← กลับไปรายการตอน
          </button>

          {/* Chapter Header */}
          <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 border border-[#2a2a2a]">
            <h1 className="text-3xl font-bold mb-2">{selectedChapter.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Eye size={16} />
                {selectedChapter.views} ครั้ง
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                {formatDate(selectedChapter.publishedAt)}
              </span>
              <span>{selectedChapter.wordCount} คำ</span>
            </div>
          </div>

          {/* Chapter Content */}
          <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 border border-[#2a2a2a]">
            <div className="prose prose-invert max-w-none">
              <div className="text-lg leading-relaxed whitespace-pre-wrap text-left">
                {selectedChapter.content || 'ไม่มีเนื้อหาในตอนนี้'}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mb-8">
            {selectedChapter.number > 1 && (
              <button
                onClick={() => handleChapterClick(chapters[selectedChapter.number - 2])}
                className="px-6 py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
              >
                ← ตอนก่อนหน้า
              </button>
            )}
            {selectedChapter.number < chapters.length && (
              <button
                onClick={() => handleChapterClick(chapters[selectedChapter.number])}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition ml-auto"
              >
                ตอนถัดไป →
              </button>
            )}
          </div>

          {/* Social Actions */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <SocialActions
              postId={selectedChapter.id}
              postType="chapter"
              onCommentClick={() => setShowComments(true)}
            />
          </div>
        </div>

        <CommentSection
          postId={selectedChapter.id}
          postType="chapter"
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-purple-400 transition"
        >
          ← กลับไปหน้านิยาย
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#2a2a2a] sticky top-8">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-medium">
                    {story.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">{story.title}</h1>
                <p className="text-sm text-gray-400 mb-4">{story.category}</p>

                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-[#2a2a2a]">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{story.chapters}</div>
                    <div className="text-xs text-gray-400">ตอน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">{viewCount}</div>
                    <div className="text-xs text-gray-400">อ่าน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{likeCount}</div>
                    <div className="text-xs text-gray-400">ไลค์</div>
                  </div>
                </div>

                <Link 
                  to={`/profile/${story.authorId}`}
                  className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a2a] hover:opacity-80 transition group"
                >
                  <UserAvatar userId={story.authorId} className="w-12 h-12" />
                  <div className="flex-1">
                    <UserAvatar 
                      userId={story.authorId} 
                      showName={true} 
                      className="hidden" 
                      nameClassName="font-medium group-hover:text-purple-400 transition"
                    />
                    <p className="text-xs text-gray-400">ผู้เขียน</p>
                  </div>
                </Link>

                <div className="flex flex-wrap gap-2 mb-6">
                  {story.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-xs bg-[#2a2a2a] text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleChapterClick(chapters[0])}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
                  >
                    เริ่มอ่าน
                  </button>
                  <button
                    onClick={() => setShowComments(true)}
                    className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] font-medium transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    แสดงความคิดเห็น
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={`w-full py-3 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                      bookmarked 
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                        : 'bg-transparent border-[#3a3a3a] text-gray-400 hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
                    {bookmarked ? 'บันทึกแล้ว' : 'บันทึกรายการโปรด'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-6 border border-[#2a2a2a]">
              <h2 className="text-xl font-bold mb-4">เรื่องย่อ</h2>
              <p className="text-gray-300 leading-relaxed">{story.description}</p>
              
              <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    เผยแพร่: {formatDate(story.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    อัปเดตล่าสุด: {formatDate(story.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-6 border border-[#2a2a2a]">
              <SocialActions
                postId={story.id}
                postType="story"
                onCommentClick={() => setShowComments(true)}
              />
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              <h2 className="text-xl font-bold mb-4">รายการตอน ({chapters.length} ตอน)</h2>
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterClick(chapter)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] border-2 border-transparent hover:border-purple-500 transition group"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                        {chapter.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium group-hover:text-purple-400 transition">
                          {chapter.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {chapter.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(chapter.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CommentSection
        postId={storyId}
        postType="story"
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
};

export default StoryDetail;
