import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, Heart, Clock, User, ChevronRight, MessageCircle, Share2, Edit, Trash2, Calendar, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { useSocial } from '../contexts/SocialContext';
import SocialActions from '../components/SocialActions';
import CommentSection from '../components/CommentSection';
import FollowButton from '../components/FollowButton';
import UserAvatar from '../components/UserAvatar';
import { collection, query, where, orderBy, getDocs, getDoc, doc, deleteDoc, updateDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const StoryDetail = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { credits, deductCredits } = useCredit();
  const { incrementView, getViewCount, getLikeCount } = useSocial();
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [purchasedChapters, setPurchasedChapters] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchStoryDetail();
    incrementView(storyId, 'story');
    if (currentUser) {
      loadPurchasedChapters();
      checkAdminStatus();
    }
  }, [storyId, currentUser]);

  useEffect(() => {
    if (storyId) {
      loadCounts();
    }
  }, [storyId, currentUser]);

  const loadCounts = async () => {
    const views = await getViewCount(storyId, 'story');
    const likes = await getLikeCount(storyId, 'story');
    setViewCount(views);
    setLikeCount(likes);
  };

  const fetchStoryDetail = async () => {
    setLoading(true);
    try {
      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (storyDoc.exists()) {
        setStory({ id: storyDoc.id, ...storyDoc.data() });
      }
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

  const loadPurchasedChapters = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'chapterPurchases'),
        where('userId', '==', currentUser.uid),
        where('storyId', '==', storyId)
      );
      const snapshot = await getDocs(q);
      const purchased = snapshot.docs.map(doc => doc.data().chapterId);
      setPurchasedChapters(purchased);
    } catch (error) {
      console.error('Error loading purchased chapters:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const isChapterFree = (chapter) => {
    if (!chapter.price || chapter.price === 0) return true;
    if (chapter.freeDate) {
      const freeDate = chapter.freeDate.toDate ? chapter.freeDate.toDate() : new Date(chapter.freeDate);
      return new Date() >= freeDate;
    }
    return false;
  };

  const canReadChapter = (chapter) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (currentUser.uid === story?.authorId) return true;
    if (isChapterFree(chapter)) return true;
    return purchasedChapters.includes(chapter.id);
  };

  const handlePurchaseChapter = async (chapter) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนซื้อตอน');
      navigate('/login');
      return;
    }

    if (credits < chapter.price) {
      if (confirm(`เครดิตของคุณไม่เพียงพอ (มี ${credits} ต้องการ ${chapter.price})
ต้องการไปเติมเครดิตหรือไม่?`)) {
        navigate('/credits');
      }
      return;
    }

    if (!confirm(`ซื้อตอน "${chapter.title}" ด้วย ${chapter.price} เครดิต?`)) {
      return;
    }

    setPurchasing(true);
    try {
      // หักเครดิตจากผู้ซื้อ
      await deductCredits(chapter.price, `ซื้อตอน: ${chapter.title}`);
      
      // บันทึกการซื้อ
      await addDoc(collection(db, 'chapterPurchases'), {
        userId: currentUser.uid,
        storyId: storyId,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        authorId: story.authorId,
        price: chapter.price,
        purchasedAt: serverTimestamp()
      });

      // โอนเครดิตให้เจ้าของนิยาย
      const authorRef = doc(db, 'users', story.authorId);
      const authorDoc = await getDoc(authorRef);
      
      if (authorDoc.exists()) {
        const currentCredits = authorDoc.data().credits || 0;
        await updateDoc(authorRef, {
          credits: currentCredits + chapter.price
        });

        // บันทึกธุรกรรมรายได้ของเจ้าของ
        await addDoc(collection(db, 'transactions'), {
          userId: story.authorId,
          type: 'income',
          amount: chapter.price,
          description: `รายได้จากการขายตอน: ${chapter.title}`,
          fromUserId: currentUser.uid,
          storyId: storyId,
          chapterId: chapter.id,
          timestamp: serverTimestamp()
        });
      }

      setPurchasedChapters([...purchasedChapters, chapter.id]);
      setSelectedChapter(chapter);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      alert('ซื้อตอนสำเร็จ!');
    } catch (error) {
      console.error('Error purchasing chapter:', error);
      alert('เกิดข้อผิดพลาดในการซื้อตอน');
    } finally {
      setPurchasing(false);
    }
  };

  const handleChapterClick = (chapter) => {
    if (!canReadChapter(chapter)) {
      handlePurchaseChapter(chapter);
      return;
    }
    setSelectedChapter(chapter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteStory = async () => {
    if (!confirm('คุณต้องการลบเรื่องนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    setDeleting(true);
    try {
      // ดึง Firebase ID Token
      const idToken = await currentUser.getIdToken();

      // เรียก API เพื่อลบ story (ใช้ Vercel Function ที่มี Admin SDK)
      const response = await fetch('/api/delete-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: storyId,
          idToken: idToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'เกิดข้อผิดพลาดในการลบ');
      }

      alert(`ลบเรื่องสำเร็จ! (ลบ ${result.deletedChapters} ตอน)`);
      navigate('/stories');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('เกิดข้อผิดพลาดในการลบเรื่อง: ' + error.message);
    } finally {
      setDeleting(false);
    }
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

  if (selectedChapter) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedChapter(null)}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-purple-400 transition"
          >
            ← กลับไปรายการตอน
          </button>

          <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 border border-[#2a2a2a]">
            <div className="flex items-start justify-between mb-4">
              <div>
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
              {currentUser && (currentUser.uid === story.authorId || isAdmin) && (
                <Link
                  to={`/story/${storyId}/chapter/${selectedChapter.id}/edit`}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Edit size={16} />
                  แก้ไข
                </Link>
              )}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-8 mb-8 border border-[#2a2a2a]">
            {canReadChapter(selectedChapter) ? (
              <div className="prose prose-invert max-w-none">
                <div className="text-lg leading-relaxed whitespace-pre-wrap text-left">
                  {selectedChapter.content || 'ไม่มีเนื้อหาในตอนนี้'}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold mb-2">ตอนนี้ต้องซื้อก่อนอ่าน</h3>
                <p className="text-gray-400 mb-6">
                  ราคา: {selectedChapter.price} เครดิต
                  {selectedChapter.freeDate && !isChapterFree(selectedChapter) && (
                    <span className="block mt-2">
                      หรือรออ่านฟรีได้ในวันที่: {formatDate(selectedChapter.freeDate)}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => handlePurchaseChapter(selectedChapter)}
                  disabled={purchasing}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {purchasing ? 'กำลังดำเนินการ...' : `ซื้อตอน ${selectedChapter.price} เครดิต`}
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  เครดิตคงเหลือ: {credits}
                </p>
              </div>
            )}
          </div>

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

                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a2a]">
                  <Link 
                    to={`/profile/${story.authorId}`}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition group"
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
                  <FollowButton targetUserId={story.authorId} />
                </div>

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
                  {chapters.length > 0 && (
                    <button
                      onClick={() => handleChapterClick(chapters[0])}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
                    >
                      เริ่มอ่าน
                    </button>
                  )}
                  <button
                    onClick={() => setShowComments(true)}
                    className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] font-medium transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    แสดงความคิดเห็น
                  </button>

                  {currentUser && (currentUser.uid === story.authorId || isAdmin) && (
                    <>
                      <Link
                        to={`/story/${storyId}/edit`}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Edit size={18} />
                        แก้ไขเรื่อง
                      </Link>
                      <button
                        onClick={handleDeleteStory}
                        disabled={deleting}
                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                        {deleting ? "กำลังลบ..." : "ลบเรื่อง"}
                      </button>
                    </>
                  )}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">รายการตอน ({chapters.length} ตอน)</h2>
                {currentUser && (currentUser.uid === story.authorId || isAdmin) && (
                  <Link
                    to={`/story/${storyId}/add-chapter`}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-medium transition flex items-center gap-2"
                  >
                    <Plus size={16} />
                    เพิ่มตอน
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] border-2 border-transparent hover:border-purple-500 transition group"
                  >
                    <button
                      onClick={() => handleChapterClick(chapter)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                        {chapter.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium group-hover:text-purple-400 transition">
                            {chapter.title}
                          </h3>
                          {isChapterFree(chapter) ? (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">
                              ฟรี
                            </span>
                          ) : chapter.price > 0 && (
                            purchasedChapters.includes(chapter.id) ? (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                                ซื้อแล้ว
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">
                                {chapter.price} เครดิต
                              </span>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {chapter.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(chapter.publishedAt)}
                          </span>
                          {chapter.freeDate && !isChapterFree(chapter) && (
                            <span className="text-xs text-gray-500">
                              ฟรี: {formatDate(chapter.freeDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {currentUser && (currentUser.uid === story.authorId || isAdmin) && (isAdmin) && (
                        <Link
                          to={`/story/${storyId}/chapter/${chapter.id}/edit`}
                          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
                          title="แก้ไขตอน"
                        >
                          <Edit size={16} />
                        </Link>
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
