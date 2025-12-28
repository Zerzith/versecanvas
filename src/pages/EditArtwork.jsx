import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Save, Trash2, ArrowLeft, Upload, X } from 'lucide-react';

export default function EditArtwork() {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [artwork, setArtwork] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ภาพวาด',
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  const categories = ['ภาพวาด', 'ดิจิทัลอาร์ต', 'ภาพถ่าย', 'ภาพประกอบ', 'การออกแบบ', 'อื่นๆ'];

  useEffect(() => {
    loadArtwork();
  }, [artworkId]);

  const loadArtwork = async () => {
    try {
      const artworkDoc = await getDoc(doc(db, 'artworks', artworkId));
      if (artworkDoc.exists()) {
        const artworkData = artworkDoc.data();
        
        // ตรวจสอบว่าเป็นเจ้าของผลงานหรือไม่
        if (artworkData.authorId !== currentUser?.uid && artworkData.artistId !== currentUser?.uid) {
          alert('คุณไม่มีสิทธิ์แก้ไขผลงานนี้');
          navigate('/artworks');
          return;
        }

        setArtwork(artworkData);
        setImagePreview(artworkData.imageUrl);
        setFormData({
          title: artworkData.title || '',
          description: artworkData.description || '',
          category: artworkData.category || 'ภาพวาด',
          tags: artworkData.tags || []
        });
      } else {
        alert('ไม่พบผลงานนี้');
        navigate('/artworks');
      }
    } catch (error) {
      console.error('Error loading artwork:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'CommissionArt');
      formData.append('cloud_name', 'ds5t11i5v');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/ds5t11i5v/image/upload',
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        setImagePreview(data.secure_url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('กรุณาใส่ชื่อผลงาน');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        imageUrl: imagePreview,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'artworks', artworkId), updateData);

      alert('บันทึกสำเร็จ!');
      navigate('/artworks');
    } catch (error) {
      console.error('Error saving artwork:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบผลงานนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    setSaving(true);
    try {
      await deleteDoc(doc(db, 'artworks', artworkId));
      alert('ลบผลงานสำเร็จ!');
      navigate('/artworks');
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('เกิดข้อผิดพลาดในการลบผลงาน');
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/artworks')}
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition mb-4"
            >
              <ArrowLeft size={20} />
              กลับ
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              แก้ไขผลงาน
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={18} />
              ลบผลงาน
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
          {/* Image Upload */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">รูปภาพผลงาน</label>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#2a2a2a]">
              {imagePreview && (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">{uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปภาพ'}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">ชื่อผลงาน</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              placeholder="ใส่ชื่อผลงาน..."
            />
          </div>

          {/* Description */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">คำอธิบาย</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-32 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="เขียนคำอธิบายผลงาน..."
            />
          </div>

          {/* Category */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">หมวดหมู่</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <label className="block text-sm text-gray-400 mb-3">แท็ก</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="เพิ่มแท็ก..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition"
              >
                เพิ่ม
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
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 transition"
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
