import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../lib/cloudinary';
import { Save, Plus, Edit, Trash2, ArrowLeft, Upload } from 'lucide-react';

export default function EditStory() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [story, setStory] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    status: 'กำลังเขียน'
  });
  const [newTag, setNewTag] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (storyDoc.exists()) {
        const storyData = storyDoc.data();
        
        // ตรวจสอบว่าเป็นเจ้าของเรื่องหรือไม่
        if (storyData.authorId !== currentUser.uid) {
          alert('คุณไม่มีสิทธิ์แก้ไขเรื่องนี้');
          navigate(`/story/${storyId}`);
          return;
        }

        setStory(storyData);
        setFormData({
          title: storyData.title || '',
          description: storyData.description || '',
          category: storyData.category || '',
          tags: storyData.tags || [],
          status: storyData.status || 'กำลังเขียน'
        });
      }
    } catch (error) {
      console.error('Error loading story:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setCoverImage(imageUrl);
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูป');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบเรื่องนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    setSaving(true);
    try {
      // ลบตอนทั้งหมดก่อน
      const chaptersRef = collection(db, 'stories', storyId, 'chapters');
      const chaptersSnapshot = await getDocs(chaptersRef);
      
      const batch = writeBatch(db);
      chaptersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // ลบเรื่อง
      await deleteDoc(doc(db, 'stories', storyId));

      alert('ลบเรื่องสำเร็จ!');
      navigate('/stories');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('เกิดข้อผิดพลาดในการลบเรื่อง');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('กรุณาใส่ชื่อเรื่อง');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (coverImage) {
        updateData.coverImage = coverImage;
      }

      await updateDoc(doc(db, 'stories', storyId), updateData);

      alert('บันทึกสำเร็จ!');
      navigate(`/story/${storyId}`);
    } catch (error) {
      console.error('Error saving story:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
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
              แก้ไขเรื่อง
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={18} />
              ลบเรื่อง
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

        {/* Form */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">รูปปก</label>
            <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-xl overflow-hidden bg-[#2a2a2a]">
              {(coverImage || story?.coverImage) && (
                <img
                  src={coverImage || story?.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition cursor-pointer">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">{uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปปก'}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">ชื่อเรื่อง</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              placeholder="ใส่ชื่อเรื่อง..."
            />
          </div>

          {/* Description */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">เรื่องย่อ</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-32 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="เขียนเรื่องย่อ..."
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              <label className="block text-sm text-gray-400 mb-3">หมวดหมู่</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="">เลือกหมวดหมู่</option>
                <option value="แฟนตาซี">แฟนตาซี</option>
                <option value="โรแมนติก">โรแมนติก</option>
                <option value="ผจญภัย">ผจญภัย</option>
                <option value="สยองขวัญ">สยองขวัญ</option>
                <option value="ดราม่า">ดราม่า</option>
                <option value="ตลก">ตลก</option>
              </select>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              <label className="block text-sm text-gray-400 mb-3">สถานะ</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="กำลังเขียน">กำลังเขียน</option>
                <option value="จบแล้ว">จบแล้ว</option>
                <option value="พักเขียน">พักเขียน</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">แท็ก</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="เพิ่มแท็ก..."
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
