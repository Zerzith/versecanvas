import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Eye, Heart, Clock, User, ChevronRight, MessageCircle, Share2, Bookmark, Edit, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import SocialActions from '../components/SocialActions';
import CommentSection from '../components/CommentSection';
import FollowButton from '../components/FollowButton';
import { collection, query, orderBy, getDocs, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const StoryDetail = () => {
  const { storyId } = useParams();
  const { currentUser } = useAuth();
  const { incrementView, getViewCount, getLikeCount } = useSocial();
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
    }
  }, [storyId]);

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



  const getChapterTitle = (num) => {
    const titles = [
      'จุดเริ่มต้น', 'การเดินทาง', 'พบกัน', 'ความลับ', 'ความท้าทาย',
      'การต่อสู้', 'ความหวัง', 'ความรัก', 'การเปลี่ยนแปลง', 'ความจริง',
      'การตัดสินใจ', 'ความเสี่ยง', 'การเสียสละ', 'ความกล้าหาญ', 'จุดจบ',
      'การกลับมา', 'ความสุข', 'ความเศร้า', 'การพบกันใหม่', 'อนาคต',
      'ความฝัน', 'ความทรงจำ', 'การอำลา', 'การเริ่มต้นใหม่', 'ความหวัง',
      'การผจญภัย', 'ความลึกลับ', 'การค้นพบ', 'ความสำเร็จ', 'บทสรุป'
    ];
    return titles[num - 1] || `บทที่ ${num}`;
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    // Scroll to top when opening a chapter
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <Clock size={16} />
                {new Date(selectedChapter.publishedAt).toLocaleDateString('th-TH')}
              </span>
              <span>{selectedChapter.wordCount} คำ</span>
            </div>
          </div>

          {/* Chapter Content */}
          <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 border border-[#2a2a2a]">
            <div className="prose prose-invert max-w-none" style={{ scrollMarginTop: '100px' }}>
              {selectedChapter.content ? (
                <div className="text-lg leading-relaxed whitespace-pre-wrap" style={{ textAlign: 'left' }}>
                  {selectedChapter.content}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">ไม่มีเนื้อหาในตอนนี้</p>
                  <p className="text-sm text-gray-500">
                    ข้อมูลอาจยังไม่ได้บันทึกใน Firebase Firestore หรือฟิลด์ content ไม่มีค่า
                  </p>
                </div>
              )}
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

        {/* Comments */}
        <CommentSection
          postId={selectedChapter.id}
          postType="chapter"
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      </div>
    );
  }

  // Story overview
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-purple-400 transition"
        >
          ← กลับไปหน้านิยาย
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cover and Info */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#2a2a2a] sticky top-8">
              {/* Cover Image */}
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

              {/* Info */}
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">{story.title}</h1>
                <p className="text-sm text-gray-400 mb-4">{story.category}</p>

                {/* Stats */}
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

                {/* Author */}
                <Link 
                  to={`/profile/${story.authorId}`}
                  className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a2a] hover:opacity-80 transition group"
                >
                  <img
                    src={story.authorAvatar}
                    alt={story.authorName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-purple-400 transition">{story.authorName}</p>
                    <p className="text-xs text-gray-400">ผู้เขียน</p>
                  </div>
                </Link>
                {currentUser && currentUser.uid !== story.authorId && (
                  <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
                    <FollowButton userId={story.authorId} />
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {story.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-xs bg-[#2a2a2a] text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {currentUser && currentUser.uid === story.authorId && (
                    <>
                      <Link
                        to={`/story/${story.id}/edit`}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Edit size={18} />
                        แก้ไขเรื่อง
                      </Link>
                      <Link
                        to={`/story/${story.id}/add-chapter`}
                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        เพิ่มตอนใหม่
                      </Link>
                    </>
                  )}
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
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Description and Chapters */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-6 border border-[#2a2a2a]">
              <h2 className="text-xl font-bold mb-4">เรื่องย่อ</h2>
              <p className="text-gray-300 leading-relaxed">{story.description}</p>
              
              <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>เผยแพร่: {new Date(story.createdAt).toLocaleDateString('th-TH')}</span>
                  <span>อัปเดตล่าสุด: {new Date(story.updatedAt).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>

            {/* Social Actions */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-6 border border-[#2a2a2a]">
              <SocialActions
                postId={story.id}
                postType="story"
                onCommentClick={() => setShowComments(true)}
              />
            </div>

            {/* Chapters List */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              <h2 className="text-xl font-bold mb-4">รายการตอน ({chapters.length} ตอน)</h2>
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] border-2 border-transparent hover:border-purple-500 transition group"
                  >
                    <button
                      onClick={() => handleChapterClick(chapter)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
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
                            <Clock size={14} />
                            {new Date(chapter.publishedAt).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {currentUser && currentUser.uid === story.authorId && (
                        <>
                          <Link
                            to={`/story/${storyId}/chapter/${chapter.id}/edit`}
                            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit size={16} />
                          </Link>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      <CommentSection
        postId={story.id}
        postType="story"
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
};

export default StoryDetail;
