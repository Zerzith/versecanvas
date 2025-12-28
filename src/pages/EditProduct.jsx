import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage, validateImage } from '../lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, AlertCircle, ArrowLeft, Image as ImageIcon, Package, Trash2 } from 'lucide-react';

export default function EditProduct() {
  const { productId } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const categories = ['คอมมิชชั่น', 'E-book', 'ภาพประกอบ', 'ดีไซน์', 'Artsign', 'อื่นๆ'];

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (!productDoc.exists()) {
        setError('ไม่พบสินค้า');
        return;
      }

      const productData = productDoc.data();

      // ตรวจสอบว่าเป็นเจ้าของสินค้าหรือไม่
      if (productData.sellerId !== currentUser?.uid) {
        setError('คุณไม่มีสิทธิ์แก้ไขสินค้านี้');
        setTimeout(() => navigate('/shop'), 2000);
        return;
      }

      setTitle(productData.title || '');
      setDescription(productData.description || '');
      setPrice(productData.price?.toString() || '');
      setCategory(productData.category || '');
      setCurrentImage(productData.image || '');
      setProductImagePreview(productData.image || '');
    } catch (error) {
      console.error('Error loading product:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบสินค้านี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    setSaving(true);
    try {
      await deleteDoc(doc(db, 'products', productId));
      alert('ลบสินค้าสำเร็จ!');
      navigate('/shop');
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('เกิดข้อผิดพลาดในการลบสินค้า: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนแก้ไขสินค้า');
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

    setSaving(true);
    setError('');

    try {
      let imageUrl = currentImage;

      // อัปโหลดรูปภาพใหม่ถ้ามีการเปลี่ยน
      if (productImage) {
        setUploading(true);
        imageUrl = await uploadImage(productImage);
        setUploading(false);

        console.log('Image uploaded successfully:', imageUrl);

        if (!imageUrl) {
          throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
        }
      }

      // อัปเดตข้อมูลสินค้าใน Firestore
      const productData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        image: imageUrl,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'products', productId), productData);
      console.log('Product updated successfully:', productId, productData);

      alert('แก้ไขสินค้าสำเร็จ!');
      navigate('/shop');
    } catch (error) {
      console.error('Error updating product:', error);
      setError('เกิดข้อผิดพลาดในการแก้ไขสินค้า: ' + error.message);
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
          <p className="text-gray-400 mb-6">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถแก้ไขสินค้าได้</p>
          <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-pink-500 to-purple-500">
            เข้าสู่ระบบ
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">กำลังโหลดข้อมูลสินค้า...</p>
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
                แก้ไขสินค้า
              </h1>
              <p className="text-gray-400 mt-1">แก้ไขข้อมูลสินค้าของคุณ</p>
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
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-2 right-2 p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                      เปลี่ยนรูป
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
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={saving}
              className="border-red-500 text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="mr-2" size={18} />
              ลบสินค้า
            </Button>
            <div className="flex space-x-4">
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
              disabled={saving || uploading}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {uploading ? (
                <>
                  <Upload className="animate-spin mr-2" size={18} />
                  กำลังอัปโหลด...
                </>
              ) : saving ? (
                <>
                  <Save className="animate-pulse mr-2" size={18} />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  บันทึกการแก้ไข
                </>
              )}
            </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
