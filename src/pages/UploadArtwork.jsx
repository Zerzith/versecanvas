import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, validateImage } from '../lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, AlertCircle, ArrowLeft, Image as ImageIcon, Save } from 'lucide-react';

const UploadArtwork = ({ currentLanguage }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [artworkImage, setArtworkImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const isThaiLanguage = currentLanguage === 'th';

  const categories = isThaiLanguage 
    ? ['ภาพวาด', 'ดิจิทัลอาร์ต', 'ภาพถ่าย', 'ภาพประกอบ', 'การออกแบบ', 'อื่นๆ']
    : ['Painting', 'Digital Art', 'Photography', 'Illustration', 'Design', 'Other'];

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setArtworkImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError(isThaiLanguage ? 'กรุณาเข้าสู่ระบบก่อนอัปโหลดงานศิลปะ' : 'Please login to upload artwork');
      return;
    }

    if (!title || !description || !category || !artworkImage) {
      setError(isThaiLanguage ? 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกรูปภาพ' : 'Please fill in all fields and select an image');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Upload artwork image
      setUploading(true);
      const uploadResult = await uploadImage(artworkImage, {
        folder: 'versecanvas/artworks',
        tags: ['artwork']
      });
      const imageUrl = uploadResult.url;
      setUploading(false);

      // Create artwork document
      const artworkData = {
        title,
        description,
        imageUrl,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        artistId: currentUser.uid,
        artistName: userProfile?.displayName || currentUser.displayName || 'Anonymous',
        views: 0,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'artworks'), artworkData);
      
      // Navigate to the uploaded artwork
      navigate(`/artwork/${docRef.id}`);
    } catch (error) {
      console.error('Error uploading artwork:', error);
      setError(isThaiLanguage ? 'เกิดข้อผิดพลาดในการอัปโหลดงานศิลปะ' : 'Failed to upload artwork');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {isThaiLanguage ? 'กรุณาเข้าสู่ระบบ' : 'Please Login'}
          </h2>
          <p className="text-gray-400 mb-4">
            {isThaiLanguage 
              ? 'คุณต้องเข้าสู่ระบบก่อนอัปโหลดงานศิลปะ'
              : 'You need to login before uploading artwork'
            }
          </p>
          <Button onClick={() => navigate('/login')}>
            {isThaiLanguage ? 'เข้าสู่ระบบ' : 'Login'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8">
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
            {isThaiLanguage ? 'อัปโหลดงานศิลปะ' : 'Upload Artwork'}
          </h1>
          <p className="text-gray-400">
            {isThaiLanguage 
              ? 'แบ่งปันงานศิลปะของคุณกับผู้คนทั่วโลก'
              : 'Share your artwork with people around the world'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-6 space-y-6">
            {/* Artwork Image */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {isThaiLanguage ? 'รูปภาพงานศิลปะ' : 'Artwork Image'} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center">
                {imagePreview ? (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden border-2 border-[#2a2a2a]">
                    <img
                      src={imagePreview}
                      alt="Artwork preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setArtworkImage(null);
                        setImagePreview('');
                      }}
                      className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl h-64 rounded-lg border-2 border-dashed border-[#2a2a2a] flex flex-col items-center justify-center bg-[#0f0f0f] mb-4 cursor-pointer hover:border-purple-500 transition-colors"
                       onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-400 font-medium mb-2">
                      {isThaiLanguage ? 'คลิกเพื่ออัปโหลดรูปภาพ' : 'Click to upload image'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isThaiLanguage 
                        ? 'รองรับ JPG, PNG, GIF (สูงสุด 10MB)'
                        : 'Supports JPG, PNG, GIF (max 10MB)'
                      }
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  required
                />
                {!imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isThaiLanguage ? 'เลือกรูปภาพ' : 'Select Image'}
                  </Button>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {isThaiLanguage ? 'ชื่อผลงาน' : 'Title'} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isThaiLanguage ? 'กรอกชื่อผลงาน' : 'Enter artwork title'}
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
                placeholder={isThaiLanguage ? 'เขียนคำอธิบายเกี่ยวกับผลงาน' : 'Write a description about your artwork'}
                rows={4}
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
                  className="w-full px-3 py-2 bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
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
                  {isThaiLanguage ? 'เผยแพร่ผลงาน' : 'Publish Artwork'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadArtwork;

