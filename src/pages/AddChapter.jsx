import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, getDoc } from 'firebase/firestore';
import { Save, ArrowLeft } from 'lucide-react';

export default function AddChapter() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    price: 0,
    freeDate: ''
  });

  useEffect(() => {
    verifyOwnership();
  }, [storyId, currentUser]);

  const verifyOwnership = async () => {
    if (!currentUser) {
      alert('กรุณาลงชื่อก่อนเข้า');
      navigate('/login');
      return;
    }

    try {
      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (storyDoc.exists()) {
        const storyData = storyDoc.data();
        if (storyData.authorId !== currentUser.uid) {
          alert('คุณไม่มีสิทธิ์เพิ่มตอนในเรื่องนี้');
          navigate(`/story/${storyId}`);
          return;
        }
      }
    } catch (error) {
      console.error('Error verifying ownership:', error);
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('กรุณาใส่ชื่อตอน');
      return;
    }

    if (!formData.content.trim()) {
      alert('กรุณาเขียนเนื้อหา');
      return;
    }

    setSaving(true);
    try {
      // ดึงจำนวนตอนปัจจุบัน
      const chaptersSnapshot = await getDocs(collection(db, 'stories', storyId, 'chapters'));
      const currentChapterCount = chaptersSnapshot.size;
      const nextChapterNumber = currentChapterCount + 1;

      // นับจำนวนคำในเนื้อหา
      const wordCount = formData.content.trim().split(/\s+/).length;

      // เพิ่มตอนใหม่
      await addDoc(collection(db, 'stories', storyId, 'chapters'), {
        number: nextChapterNumber,
        title: formData.title,
        content: formData.content,
        authorId: currentUser.uid,
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        wordCount: wordCount,
        views: 0,
        likes: 0,
        price: parseInt(formData.price) || 0,
        freeDate: formData.freeDate ? new Date(formData.freeDate) : null,
        isPaid: parseInt(formData.price) > 0
      });

      // อัปเดตจำนวนตอนในเรื่อง
      await updateDoc(doc(db, 'stories', storyId), {
        chapters: nextChapterNumber,
        updatedAt: serverTimestamp()
      });

      alert('เพิ่มตอนสำเร็จ!');
      navigate(`/story/${storyId}`);
    } catch (error) {
      console.error('Error adding chapter:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มตอน');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(`/story/${storyId}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition mb-4"
            >
              <ArrowLeft size={20} />
              กลับ
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              เพิ่มตอนใหม่
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'กำลังบันทึก...' : 'เผยแพร่ตอน'}
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Chapter Title */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">ชื่อตอน</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              placeholder="เช่น ตอนที่ 1: จุดเริ่มต้น"
            />
          </div>

          {/* Chapter Content */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">เนื้อหา</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-96 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none font-serif leading-relaxed"
              placeholder="เขียนเนื้อหาตอนนี้..."
            />
            <p className="text-xs text-gray-500 mt-2">
              จำนวนคำ: {formData.content.split(/\s+/).filter(word => word.length > 0).length}
            </p>
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

          {/* Tips */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <h3 className="font-bold text-yellow-400 mb-2">💡 เคล็ดลับการเขียน</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• ใช้ Enter เพื่อขึ้นบรรทัดใหม่</li>
              <li>• เว้นบรรทัดระหว่างย่อหน้าเพื่อให้อ่านง่าย</li>
              <li>• แนะนำให้เขียนอย่างน้อย 500-1000 คำต่อตอน</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
