import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, validateImage } from '../lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, AlertCircle, ArrowLeft, Image as ImageIcon, Package, FileText } from 'lucide-react';

export default function AddProduct() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [productFileName, setProductFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const ebookFileInputRef = useRef(null);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const categories = ['คอมมิชชั่น', 'E-book', 'ภาพประกอบ', 'ดีไซน์', 'Artsign', 'อื่นๆ'];

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setProductImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook', 'text/plain'];
    const allowedExtensions = ['.pdf', '.epub', '.mobi', '.txt', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('รองรับเฉพาะไฟล์ PDF, EPUB, MOBI, TXT, DOCX เท่านั้น');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 50MB');
      return;
    }

    setProductFile(file);
    setProductFileName(file.name);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนลงขายสินค้า');
      return;
    }

    if (!title.trim()) {
      setError('กรุณากรอกชื่อสินค้า');
      return;
    }

    if (!description.trim()) {
      setError('กรุณากรอกคำอธิบายสินค้า');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('กรุณากรอกราคาที่ถูกต้อง');
      return;
    }

    if (!category) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }

    if (!productImage) {
      setError('กรุณาเลือกรูปภาพสินค้า');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // อัปโหลดรูปภาพ
      setUploading(true);
      const imageUrl = await uploadImage(productImage);
      setUploading(false);

      console.log('Image uploaded successfully:', imageUrl);

      if (!imageUrl) {
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
      }

      // อัปโหลดไฟล์ e-book (ถ้ามี)
      let fileUrl = null;
      if (productFile) {
        setUploadingFile(true);
        try {
          // ใช้ Cloudinary สำหรับอัปโหลดไฟล์
          const formData = new FormData();
          formData.append('file', productFile);
          formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
          formData.append('resource_type', 'raw'); // สำหรับไฟล์ที่ไม่ใช่รูปภาพ

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/raw/upload`,
            {
              method: 'POST',
              body: formData
            }
          );

          const data = await response.json();
          if (data.secure_url) {
            fileUrl = data.secure_url;
            console.log('File uploaded successfully:', fileUrl);
          }
        } catch (fileError) {
          console.error('Error uploading file:', fileError);
          // ไม่ throw error เพราะไฟล์เป็น optional
        } finally {
          setUploadingFile(false);
        }
      }

      // บันทึกข้อมูลสินค้าลง Firestore
      const sellerName = userProfile?.displayName || currentUser.displayName || 'Anonymous';
      const productData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        quantity: parseInt(quantity) || 1,
        soldCount: 0,
        image: imageUrl,
        file: fileUrl,
        fileName: productFileName || null,
        seller: sellerName,
        sellerId: currentUser.uid,
        sellerAvatar: userProfile?.photoURL || currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=random`,
        rating: 5.0,
        sales: 0,
        featured: false,
        views: 0,
        likes: 0,
        likedBy: [],
        purchasedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product saved successfully:', docRef.id, productData);

      alert('เพิ่มสินค้าสำเร็จ!');
      navigate('/shop');
    } catch (error) {
      console.error('Error adding product:', error);
      setError('เกิดข้อผิดพลาดในการเพิ่มสินค้า: ' + error.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-400 mb-6">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถลงขายสินค้าได้</p>
          <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-pink-500 to-purple-500">
            เข้าสู่ระบบ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="p-2 rounded-lg bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Package className="text-yellow-500" />
                เพิ่มสินค้าใหม่
              </h1>
              <p className="text-gray-400 mt-1">ลงขายสินค้าของคุณในร้านค้า</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
            {/* Product Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                รูปภาพสินค้า <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center">
                {productImagePreview ? (
                  <div className="relative w-full max-w-md aspect-video mb-4">
                    <img
                      src={productImagePreview}
                      alt="Preview"
                      className="relative w-full max-w-2xl rounded-lg overflow-hidden border-2 border-[#2a2a2a] mb-4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProductImage(null);
                        setProductImagePreview('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      ลบรูป
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-md aspect-video border-2 border-dashed border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-3 hover:border-purple-500 transition cursor-pointer bg-[#0f0f0f]"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-500" />
                    <div className="text-center">
                      <p className="text-gray-300 font-medium">คลิกเพื่อเลือกรูปภาพ</p>
                      <p className="text-gray-500 text-sm mt-1">PNG, JPG, WEBP (สูงสุด 10MB)</p>
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น Character Design Commission"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                คำอธิบาย <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายรายละเอียดสินค้าของคุณ..."
                rows={5}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>

            {/* Price */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                ราคา (เครดิต) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="1"
                step="1"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                จำนวนสินค้า <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                step="1"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
              <p className="text-gray-400 text-sm mt-1">
                ถ้าขายหมดแล้ว สินค้าจะหายจากหน้าร้านค้าอัตโนมัติ
              </p>
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* E-book File Upload (Optional) */}
            {category === 'E-book' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  ไฟล์ E-book (เสริม)
                </label>
                <div className="flex flex-col gap-3">
                  {productFileName ? (
                    <div className="flex items-center justify-between p-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="text-white font-medium">{productFileName}</p>
                          <p className="text-gray-400 text-sm">
                            {productFile ? `${(productFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProductFile(null);
                          setProductFileName('');
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        ลบ
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => ebookFileInputRef.current?.click()}
                      className="w-full p-6 border-2 border-dashed border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-3 hover:border-purple-500 transition cursor-pointer bg-[#0f0f0f]"
                    >
                      <FileText className="w-10 h-10 text-gray-500" />
                      <div className="text-center">
                        <p className="text-gray-300 font-medium">คลิกเพื่อเลือกไฟล์ E-book</p>
                        <p className="text-gray-500 text-sm mt-1">PDF, EPUB, MOBI, TXT, DOCX (สูงสุด 50MB)</p>
                      </div>
                    </button>
                  )}
                  <input
                    ref={ebookFileInputRef}
                    type="file"
                    accept=".pdf,.epub,.mobi,.txt,.docx,application/pdf,application/epub+zip,application/x-mobipocket-ebook,text/plain"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-gray-400 text-xs">
                    หมายเหตุ: ผู้ซื้อจะสามารถดาวน์โหลดไฟล์นี้หลังจากซื้อสำเร็จ
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/shop')}
              className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={saving || uploading || uploadingFile}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {uploading || uploadingFile ? (
                <>
                  <Upload className="animate-spin mr-2" size={18} />
                  {uploadingFile ? 'กำลังอัปโหลดไฟล์...' : 'กำลังอัปโหลด...'}
                </>
              ) : saving ? (
                <>
                  <Save className="animate-pulse mr-2" size={18} />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  เพิ่มสินค้า
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
