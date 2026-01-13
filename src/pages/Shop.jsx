import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, deleteDoc, getDoc, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ShoppingBag, Star, Heart, Search, TrendingUp, Award, ShoppingCart, Coins, Edit, Trash2
} from 'lucide-react';

export default function Shop() {
  const { currentUser } = useAuth();
  const { credits, deductCredits, transferCredits } = useCredit();
  const { createNotification } = useNotification();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [productsWithOwnership, setProductsWithOwnership] = useState([]);

  const categories = ['ทั้งหมด', 'คอมมิชชั่น', 'E-book', 'ภาพประกอบ', 'ดีไซน์', 'Artsign'];

  useEffect(() => {
    loadProducts();
  }, []);

  const fetchProductsFromFirebase = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return productsData;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const loadProducts = async () => {
    // ลองดึงจาก Firebase ก่อน
    const firebaseProducts = await fetchProductsFromFirebase();
    
    // ถ้ามีข้อมูลใน Firebase ให้ใช้ข้อมูลนั้น
    if (firebaseProducts.length > 0) {
      setProducts(firebaseProducts);
      // ตรวจสอบสิทธิ์การเป็นเจ้าของ
      const productsWithOwner = firebaseProducts.map(product => ({
        ...product,
        isOwner: currentUser && product.sellerId === currentUser.uid
      }));
      setProductsWithOwnership(productsWithOwner);
      return;
    }
    
    setProducts([]);
    setProductsWithOwnership([]);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('ยืนยันการลบสินค้านี้?')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      alert('ลบสินค้าสำเร็จ!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const handleEditProduct = (productId) => {
    navigate(`/edit-product/${productId}`);
  };

  const handlePurchase = async (product) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนซื้อสินค้า');
      navigate('/login');
      return;
    }

    if (credits < product.price) {
      if (confirm(`เครดิตของคุณไม่เพียงพอ (มี ${credits} เครดิต ต้องการ ${product.price} เครดิต)\nต้องการไปเติมเครดิตหรือไม่?`)) {
        navigate('/credits');
      }
      return;
    }

    if (!confirm(`ยืนยันการซื้อ "${product.title}" ราคา ${product.price} เครดิต?`)) {
      return;
    }

    setSelectedProduct(product);
    setPurchasing(true);

    try {
      // ตรวจสอบจำนวนสินค้า
      const productRef = doc(db, 'products', product.id);
      const productDoc = await getDoc(productRef);
      const productData = productDoc.data();
      
      const remainingQuantity = (productData.quantity || 1) - (productData.soldCount || 0);
      
      if (remainingQuantity <= 0) {
        alert('ขออภัย! สินค้านี้ขายหมดแล้ว');
        setPurchasing(false);
        setSelectedProduct(null);
        fetchProducts();
        return;
      }

      // โอนเครดิตให้ผู้ขายทันที (หักค่าธรรมเนียม 10%)
      const platformFee = Math.floor(product.price * 0.1);
      const sellerAmount = product.price - platformFee;
      
      await transferCredits(
        product.sellerId, 
        sellerAmount, 
        `ขาย ${product.title} (หลังหักค่าธรรมเนียม ${platformFee} เครดิต)`
      );

      // อัปเดตจำนวนสินค้า
      await updateDoc(productRef, {
        soldCount: increment(1)
      });

      // บันทึกคำสั่งซื้อลง Firebase
      const orderRef = await addDoc(collection(db, 'orders'), {
        productId: product.id,
        productTitle: product.title,
        productImage: product.image,
        productPrice: product.price,
        productCategory: product.category,
        productFile: product.file || null,
        buyerId: currentUser.uid,
        buyerEmail: currentUser.email,
        sellerId: product.sellerId,
        status: 'เสร็จสิ้น',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // สร้างการแจ้งเตือนให้ผู้ขาย
      await createNotification(product.sellerId, 'order', {
        orderId: orderRef.id,
        productTitle: product.title,
        productPrice: product.price,
        buyerName: currentUser.displayName || 'ลูกค้า',
        status: 'มีคนซื้อสินค้าของคุณ'
      });

      alert(`ชื้อสินค้าสำเร็จ! คุณได้ซื้อ "${product.title}" แล้ว\nตรวจสอบคำสั่งซื้อได้ที่เมนู > คำสั่งซื้อ`);
      
      // ไปหน้าคำสั่งซื้อ
      navigate('/orders');
    } catch (error) {
      console.error('Error purchasing product:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setPurchasing(false);
      setSelectedProduct(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || product.category === selectedCategory;
    const remainingQuantity = (product.quantity || 1) - (product.soldCount || 0);
    const inStock = remainingQuantity > 0;
    return matchesSearch && matchesCategory && inStock;
  });

  // สินค้ายอดฮิต: เรียงตามจำนวนการขาย (soldCount) จากมากไปน้อย
  const featuredProducts = products
    .filter(p => {
      const remainingQuantity = (p.quantity || 1) - (p.soldCount || 0);
      return remainingQuantity > 0; // มีสต็อกเหลือ
    })
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)) // เรียงตามยอดขาย
    .slice(0, 6); // แสดงเฉพาะ 6 อันแรก

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-purple-500" />
              ร้านค้า
            </h1>
            <p className="text-gray-400">ซื้อและขายงานศิลปะ นิยาย และบริการต่างๆ</p>
          </div>
          {currentUser && (
            <button
              onClick={() => navigate('/add-product')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl font-bold transition flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              ลงขายสินค้า
            </button>
          )}
        </div>

        {/* Credits Display */}
        {currentUser && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">เครดิตของคุณ</p>
                <p className="text-2xl font-bold text-white">{credits.toLocaleString()} เครดิต</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/credits')}
              className="px-6 py-2 bg-[#1a1a1a] text-orange-600 rounded-xl font-bold hover:bg-gray-100 transition"
            >
              เติมเครดิต
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto mb-8 pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Products */}
        {selectedCategory === 'ทั้งหมด' && featuredProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold">สินค้าแนะนำ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPurchase={handlePurchase}
                  purchasing={purchasing && selectedProduct?.id === product.id}
                  featured
                  isOwner={currentUser && product.sellerId === currentUser.uid}
                  onDelete={handleDeleteProduct}
                  onEdit={handleEditProduct}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div>
          <h2 className="text-2xl font-bold mb-6">สินค้าทั้งหมด</h2>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">ไม่พบสินค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPurchase={handlePurchase}
                  purchasing={purchasing && selectedProduct?.id === product.id}
                  isOwner={currentUser && product.sellerId === currentUser.uid}
                  onDelete={handleDeleteProduct}
                  onEdit={handleEditProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onPurchase, purchasing, featured = false, isOwner = false, onDelete, onEdit }) {
  return (
    <div
      className={`group bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 transition-all ${
        featured
          ? 'border-yellow-500/30 hover:border-yellow-500'
          : 'border-transparent hover:border-purple-500'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#2a2a2a]">
        {(() => {
          // รองรับทั้ง string และ object
          const imageUrl = typeof product.image === 'string' 
            ? product.image 
            : product.image?.url || '';
          
          return imageUrl && imageUrl.trim() !== '' ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                console.error('Image load error for product:', product.id, imageUrl);
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center">
                    <div class="text-center text-gray-500">
                      <svg class="w-16 h-16 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p class="text-sm">โหลดรูปไม่สำเร็จ</p>
                    </div>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ShoppingBag className="w-16 h-16 mx-auto mb-2 opacity-30" />
                <p className="text-sm">ไม่มีรูปภาพ</p>
                <p className="text-xs mt-1 opacity-50">กรุณาอัปโหลดรูปสินค้า</p>
              </div>
            </div>
          );
        })()}
        {featured && (
          <div className="absolute top-3 right-3">
            <div className="bg-yellow-500 p-2 rounded-full">
              <Award className="w-5 h-5 text-black" />
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
          {product.title}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Seller */}
        <div className="flex items-center gap-2 mb-4">
          <img
            src={product.sellerAvatar}
            alt={product.seller}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm text-gray-400">{product.seller}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-sm text-gray-400">{product.soldCount || 0} ขาย</span>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-500">{product.price}</span>
          </div>
          
          {isOwner ? (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(product.id)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onPurchase(product)}
              disabled={purchasing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังซื้อ...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  ซื้อ
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
