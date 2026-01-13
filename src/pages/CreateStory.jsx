import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, validateImage } from '../lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const CreateStory = ({ currentLanguage }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const isThaiLanguage = currentLanguage === 'th';

  const categories = isThaiLanguage 
    ? ['นิยายรัก', 'แฟนตาซี', 'ผจญภัย', 'สยองขวัญ', 'วิทยาศาสตร์', 'อื่นๆ']
    : ['Romance', 'Fantasy', 'Adventure', 'Horror', 'Sci-Fi', 'Other'];



  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setError('');
    setCoverImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImagePreview(event.target.result);
    };
    reader.onerror = () => {
      setError(isThaiLanguage ? 'ไม่สามารถโหลดรูปได้' : 'Failed to load image');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError(isThaiLanguage ? 'กรุณาเข้าสู่ระบบก่อนสร้างนิยาย' : 'Please login to create a story');
      return;
    }

    if (!title || !description || !category) {
      setError(isThaiLanguage ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      let coverImageUrl = '';
      
      // Upload cover image if exists
      if (coverImage) {
        setUploading(true);
        const uploadResult = await uploadImage(coverImage, {
          folder: 'versecanvas/stories',
          tags: ['story', 'cover']
        });
        coverImageUrl = uploadResult.url;
        setUploading(false);
      }

      // Create story document
      const storyData = {
        title,
        description,
        content: '',
        coverImage: coverImageUrl,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        authorId: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName || 'Anonymous',
        authorAvatar: userProfile?.photoURL || currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || currentUser.displayName || 'User')}&background=random`,
        status: 'published',
        chapters: 1,
        views: 0,
        likes: 0,
        likedBy: [],
        bookmarkedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'stories'), storyData);
      
      // Navigate to the created story
      navigate(`/story/${docRef.id}`);
    } catch (error) {
      console.error('Error creating story:', error);
      setError(isThaiLanguage ? 'เกิดข้อผิดพลาดในการสร้างนิยาย' : 'Failed to create story');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] pt-20">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {isThaiLanguage ? 'กรุณาเข้าสู่ระบบ' : 'Please Login'}
          </h2>
          <p className="text-gray-400 mb-4">
            {isThaiLanguage 
              ? 'คุณต้องเข้าสู่ระบบก่อนสร้างนิยาย'
              : 'You need to login before creating a story'
            }
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            {isThaiLanguage ? 'เข้าสู่ระบบ' : 'Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isThaiLanguage ? 'กลับ' : 'Back'}
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isThaiLanguage ? 'สร้างนิยายใหม่' : 'Create New Story'}
          </h1>
          <p className="text-gray-400">
            {isThaiLanguage 
              ? 'แบ่งปันนิยายของคุณกับผู้อ่านทั่วโลก'
              : 'Share your story with readers around the world'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {isThaiLanguage ? 'ชื่อเรื่อง' : 'Title'} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isThaiLanguage ? 'กรอกชื่อเรื่อง' : 'Enter story title'}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {isThaiLanguage ? 'คำอธิบาย' : 'Description'} <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isThaiLanguage ? 'เขียนคำอธิบายสั้นๆ เกี่ยวกับนิยาย' : 'Write a short description about your story'}
                rows={3}
                required
              />
            </div>

            {/* Category and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {isThaiLanguage ? 'หมวดหมู่' : 'Category'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">
                    {isThaiLanguage ? 'เลือกหมวดหมู่' : 'Select category'}
                  </option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {isThaiLanguage ? 'แท็ก' : 'Tags'}
                </label>
                <Input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={isThaiLanguage ? 'แท็ก1, แท็ก2, แท็ก3' : 'tag1, tag2, tag3'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isThaiLanguage ? 'คั่นด้วยเครื่องหมายจุลภาค' : 'Separate with commas'}
                </p>
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {isThaiLanguage ? 'ภาพปก' : 'Cover Image'}
              </label>
              <div className="flex items-start space-x-4">
                {coverImagePreview ? (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden border-2 border-[#2a2a2a]">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null);
                        setCoverImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-32 rounded-lg border-2 border-dashed border-[#2a2a2a] flex items-center justify-center bg-[#0f0f0f]">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isThaiLanguage ? 'อัปโหลดภาพ' : 'Upload Image'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    {isThaiLanguage 
                      ? 'รองรับ JPG, PNG, GIF (สูงสุด 10MB)'
                      : 'Supports JPG, PNG, GIF (max 10MB)'
                    }
                  </p>
                </div>
              </div>
            </div>


          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving || uploading}
            >
              {isThaiLanguage ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700"
              disabled={saving || uploading}
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  {isThaiLanguage ? 'กำลังอัปโหลด...' : 'Uploading...'}
                </>
              ) : saving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  {isThaiLanguage ? 'กำลังบันทึก...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isThaiLanguage ? 'เผยแพร่นิยาย' : 'Publish Story'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStory;

