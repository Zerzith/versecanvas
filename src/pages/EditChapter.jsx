import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Save, Trash2, ArrowLeft, BookOpen } from 'lucide-react';

export default function EditChapter() {
  const { storyId, chapterId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chapter, setChapter] = useState(null);
  const [story, setStory] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    number: 1,
    price: 0,
    freeDate: ''
  });

  useEffect(() => {
    loadData();
  }, [storyId, chapterId]);

  const loadData = async () => {
    try {
      if (!currentUser) {
        alert('กรุณาลงชื่อก่อนเข้า');
        navigate('/login');
        return;
      }

      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (storyDoc.exists()) {
        const storyData = storyDoc.data();
        
        if (storyData.authorId !== currentUser.uid) {
          alert('คุณไม่มีสิทธิ์แก้ไขตอนนี้');
          navigate(`/story/${storyId}`);
          return;
        }

        setStory(storyData);
      } else {
        alert('ไม่พบเรื่อง');
        navigate('/stories');
        return;
      }

      const chapterDoc = await getDoc(doc(db, 'stories', storyId, 'chapters', chapterId));
      if (chapterDoc.exists()) {
        const chapterData = chapterDoc.data();
        setChapter(chapterData);
        const freeDateValue = chapterData.freeDate ? 
          (chapterData.freeDate.toDate ? chapterData.freeDate.toDate() : new Date(chapterData.freeDate)) : null;
        
        setFormData({
          title: chapterData.title || '',
          content: chapterData.content || '',
          number: chapterData.number || 1,
          price: chapterData.price || 0,
          freeDate: freeDateValue ? freeDateValue.toISOString().slice(0, 16) : ''
        });
      } else {
        alert('ไม่พบตอน');
        navigate(`/story/${storyId}`);
        return;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('กรุณาใส่ชื่อตอน');
      return;
    }

    if (!formData.content.trim()) {
      alert('กรุณาใส่เนื้อหา');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        wordCount: formData.content.trim().split(/\s+/).length,
        updatedAt: serverTimestamp(),
        price: parseInt(formData.price) || 0,
        freeDate: formData.freeDate ? new Date(formData.freeDate) : null,
        isPaid: parseInt(formData.price) > 0
      };

      await updateDoc(doc(db, 'stories', storyId, 'chapters', chapterId), updateData);

      await updateDoc(doc(db, 'stories', storyId), {
        updatedAt: serverTimestamp()
      });

      alert('บันทึกสำเร็จ!');
      navigate(`/story/${storyId}`);
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบตอนนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    setSaving(true);
    try {
      await deleteDoc(doc(db, 'stories', storyId, 'chapters', chapterId));

      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);
      if (storyDoc.exists()) {
        const currentChapters = storyDoc.data().chapters || 0;
        await updateDoc(storyRef, {
          chapters: Math.max(0, currentChapters - 1),
          updatedAt: serverTimestamp()
        });
      }

      alert('ลบตอนสำเร็จ!');
      navigate(`/story/${storyId}`);
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('เกิดข้อผิดพลาดในการลบตอน');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(`/story/${storyId}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition mb-4"
            >
              <ArrowLeft size={20} />
              กลับ
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <BookOpen size={32} />
              แก้ไขตอน
            </h1>
            {story && (
              <p className="text-gray-400 mt-2">เรื่อง: {story.title}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={18} />
              ลบตอน
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">ตอนที่</label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              min="1"
            />
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">ชื่อตอน</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              placeholder="ใส่ชื่อตอน..."
            />
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">เนื้อหา</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-96 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none font-mono"
              placeholder="เขียนเนื้อหาตอน..."
            />
            <div className="mt-2 text-sm text-gray-400">
              จำนวนคำ: {formData.content.trim().split(/\s+/).filter(word => word).length}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">ราคาตอน</label>
            <select
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              <option value="0">ฟรี</option>
              <option value="100">100 เครดิต</option>
              <option value="200">200 เครดิต</option>
              <option value="300">300 เครดิต</option>
            </select>
            {parseInt(formData.price) > 0 && (
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-3">วันที่เปิดให้อ่านฟรี (เลือกได้)</label>
                <input
                  type="datetime-local"
                  value={formData.freeDate}
                  onChange={(e) => setFormData({ ...formData, freeDate: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  ถ้าตั้งวันที่ ตอนนี้จะเปิดให้อ่านฟรีอัตโนมัติเมื่อถึงวันที่กำหนด
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
