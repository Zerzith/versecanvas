import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../lib/cloudinary';
import { Save, Plus, Edit, Trash2, ArrowLeft, Upload, X } from 'lucide-react';

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
      if (!currentUser) {
        alert('กรุณาลงชื่อก่อนเข้า');
        navigate('/login');
        return;
      }

      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (storyDoc.exists()) {
        const storyData = storyDoc.data();
        
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
      } else {
        alert('ไม่พบเรื่อง');
        navigate('/stories');
        return;
      }
    } catch (error) {
      console.error('Error loading story:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
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
      const chaptersRef = collection(db, 'stories', storyId, 'chapters');
      const chaptersSnapshot = await getDocs(chaptersRef);
      
      const batch = writeBatch(db);
      chaptersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

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

        <div className="space-y-6">
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

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">เรื่องย่อ</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-32 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="เขียนเรื่องย่อ..."
            />
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">หมวดหมู่</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              <option value="">เลือกหมวดหมู่</option>
              <option value="ความรักโรแมนติก">ความรักโรแมนติก</option>
              <option value="ผจญภัย">ผจญภัย</option>
              <option value="นิยายวิทยาศาสตร์">นิยายวิทยาศาสตร์</option>
              <option value="แฟนตาซี">แฟนตาซี</option>
              <option value="ลึกลับ">ลึกลับ</option>
              <option value="สยองขวัญ">สยองขวัญ</option>
              <option value="ประวัติศาสตร์">ประวัติศาสตร์</option>
              <option value="อื่น ๆ">อื่น ๆ</option>
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
              <option value="เสร็จสิ้น">เสร็จสิ้น</option>
              <option value="หยุดชั่วคราว">หยุดชั่วคราว</option>
            </select>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">ปก</label>
            <div className="flex items-center gap-4">
              {(coverImage || story?.coverImage) && (
                <div className="relative">
                  <img
                    src={coverImage || story.coverImage}
                    alt="Cover"
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  {coverImage && (
                    <span className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      ใหม่
                    </span>
                  )}
                </div>
              )}
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="px-4 py-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] hover:border-purple-500 transition cursor-pointer flex items-center gap-2">
                  <Upload size={18} />
                  {uploading ? 'กำลังอัปโหลด...' : (coverImage ? 'เปลี่ยนรูปปก' : 'เลือกรูปปก')}
                </div>
              </label>
              {coverImage && (
                <button
                  onClick={() => setCoverImage(null)}
                  className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
                >
                  <X size={18} />
                  ยกเลิก
                </button>
              )}
            </div>
            {coverImage && (
              <p className="text-xs text-green-400 mt-2">
                ✓ รูปปกใหม่พร้อมบันทึก กดปุ่มบันทึกเพื่อเปลี่ยนปก
              </p>
            )}
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">แท็ก</label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                placeholder="เพิ่มแท็ก..."
              />
              <button
                onClick={handleAddTag}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus size={18} />
                เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm bg-purple-600 text-white flex items-center gap-2"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-300 transition"
                  >
                    <X size={14} />
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
