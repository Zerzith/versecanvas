import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, Eye, Download, FileText, Image, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('ทั้งหมด');
  const [downloadingId, setDownloadingId] = useState(null);
  const { currentUser } = useAuth();

  const tabs = ['ทั้งหมด', 'รอดำเนินการ', 'กำลังทำงาน', 'เสร็จสิ้น', 'ยกเลิก'];

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('buyerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ordersData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const orderData = docSnapshot.data();
          
          // ดึงข้อมูลสินค้าเพิ่มเติมถ้ามี productId
          let productData = null;
          if (orderData.productId) {
            try {
              const productDoc = await getDoc(doc(db, 'products', orderData.productId));
              if (productDoc.exists()) {
                productData = productDoc.data();
              }
            } catch (e) {
              console.log('Could not fetch product:', e);
            }
          }
          
          return {
            id: docSnapshot.id,
            ...orderData,
            productData,
            createdAt: orderData.createdAt?.toDate() || new Date()
          };
        })
      );
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedTab === 'ทั้งหมด') return true;
    return order.status === selectedTab;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'รอดำเนินการ':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'กำลังทำงาน':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'เสร็จสิ้น':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ยกเลิก':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'รอดำเนินการ':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'กำลังทำงาน':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'เสร็จสิ้น':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'ยกเลิก':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  // ฟังก์ชันดึง URL รูปภาพที่ถูกต้อง
  const getImageUrl = (order) => {
    // ลำดับความสำคัญ: productFile (ไฟล์ต้นฉบับ) > productImage > productData.image
    if (order.productFile && order.status === 'เสร็จสิ้น') {
      return order.productFile;
    }
    if (order.productImage) {
      return typeof order.productImage === 'string' 
        ? order.productImage 
        : order.productImage?.url || '';
    }
    if (order.productData?.image) {
      return typeof order.productData.image === 'string'
        ? order.productData.image
        : order.productData.image?.url || '';
    }
    return '';
  };

  // ฟังก์ชันดาวน์โหลดรูปภาพ - แก้ไขให้ดาวน์โหลดได้จริง
  const handleDownloadImage = async (order) => {
    const imageUrl = order.productFile || order.productImage;
    
    if (!imageUrl) {
      alert('ไม่พบไฟล์สำหรับดาวน์โหลด');
      return;
    }

    setDownloadingId(order.id);

    try {
      // สร้างชื่อไฟล์
      const fileName = `${order.productTitle || 'artwork'}_${order.id}.${getFileExtension(imageUrl)}`;
      
      // วิธีที่ 1: ใช้ Cloudinary fl_attachment transformation
      if (imageUrl.includes('cloudinary.com')) {
        let downloadUrl = imageUrl;
        
        // เพิ่ม fl_attachment ใน transformation
        if (imageUrl.includes('/upload/')) {
          downloadUrl = imageUrl.replace('/upload/', '/upload/fl_attachment:' + encodeURIComponent(fileName) + '/');
        }
        
        // สร้าง link และดาวน์โหลด
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_self';
        link.rel = 'noopener noreferrer';
        
        // ใช้ click() โดยตรง
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadingId(null);
        return;
      }
      
      // วิธีที่ 2: สำหรับ URL อื่นๆ ใช้ fetch และ blob
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('ไม่สามารถดาวน์โหลดไฟล์ได้');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // สร้าง link และคลิกเพื่อดาวน์โหลด
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      
      // Fallback: ดาวน์โหลดโดยตรงผ่าน link
      try {
        const fileName = `${order.productTitle || 'artwork'}_${order.id}.${getFileExtension(imageUrl)}`;
        let downloadUrl = imageUrl;
        
        if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
          downloadUrl = imageUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        // เปิด URL ในหน้าต่างเดียวกันเพื่อ trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.click();
      } catch (e) {
        alert('ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // ฟังก์ชันดึงนามสกุลไฟล์
  const getFileExtension = (url) => {
    if (!url) return 'jpg';
    
    // ตรวจสอบจาก URL
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match) return match[1].toLowerCase();
    
    // ตรวจสอบจาก Cloudinary format
    if (url.includes('f_png')) return 'png';
    if (url.includes('f_webp')) return 'webp';
    if (url.includes('f_gif')) return 'gif';
    
    return 'jpg';
  };

  // ฟังก์ชันดูรูปภาพขนาดเต็ม
  const handleViewImage = (imageUrl) => {
    if (!imageUrl) return;
    
    // สำหรับ Cloudinary ให้ใช้ขนาดเต็ม
    let fullSizeUrl = imageUrl;
    if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
      // ลบ transformation ออกเพื่อดูขนาดเต็ม
      fullSizeUrl = imageUrl.replace(/\/upload\/[^/]+\//, '/upload/');
    }
    
    window.open(fullSizeUrl, '_blank');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 mb-4">กรุณาเข้าสู่ระบบเพื่อดูประวัติคำสั่งซื้อ</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-purple-500" />
              ประวัติคำสั่งซื้อ
            </h1>
            <p className="text-gray-400">ติดตามสถานะคำสั่งซื้อของคุณ</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
          >
            <RefreshCw size={16} />
            รีเฟรช
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto mb-8 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition ${
                selectedTab === tab
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">กำลังโหลด...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบคำสั่งซื้อ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const imageUrl = getImageUrl(order);
              
              return (
                <div
                  key={order.id}
                  className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-purple-500 transition"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Order Image */}
                    <div className="w-full lg:w-48 h-48 rounded-xl overflow-hidden bg-[#2a2a2a] flex-shrink-0 relative group">
                      {imageUrl ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={order.productTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full items-center justify-center hidden">
                            <div className="text-center">
                              <Image className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                              <p className="text-gray-500 text-sm">โหลดรูปไม่สำเร็จ</p>
                            </div>
                          </div>
                          {/* Overlay for view full image */}
                          <div 
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            onClick={() => handleViewImage(imageUrl)}
                          >
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{order.productTitle || 'คำสั่งซื้อ'}</h3>
                          <p className="text-sm text-gray-400 mb-2">
                            รหัสคำสั่งซื้อ: <span className="text-purple-400 font-mono">{order.id}</span>
                          </p>
                          <p className="text-sm text-gray-400">
                            วันที่สั่ง: {new Date(order.createdAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-2">
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="font-medium">{order.status}</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-400">
                            {order.productPrice?.toLocaleString() || '0'} เครดิต
                          </div>
                        </div>
                      </div>

                      {/* Order Description */}
                      {order.description && (
                        <p className="text-gray-300 mb-4 line-clamp-2">{order.description}</p>
                      )}

                      {/* Order Type & Category */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {order.productCategory && (
                          <span className="px-3 py-1 rounded-full text-xs bg-[#2a2a2a] text-gray-300">
                            {order.productCategory}
                          </span>
                        )}
                        {order.jobId && (
                          <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                            งาน Commission
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        {/* ปุ่มดาวน์โหลดรูปภาพ - สำหรับคำสั่งซื้อที่เสร็จสิ้น */}
                        {order.status === 'เสร็จสิ้น' && (order.productImage || order.productFile) && (
                          <button
                            onClick={() => handleDownloadImage(order)}
                            disabled={downloadingId === order.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 transition disabled:opacity-50"
                          >
                            {downloadingId === order.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                กำลังดาวน์โหลด...
                              </>
                            ) : (
                              <>
                                <Download size={16} />
                                ดาวน์โหลดรูปภาพ
                              </>
                            )}
                          </button>
                        )}

                        {/* ปุ่มดูรูปภาพ */}
                        {imageUrl && (
                          <button
                            onClick={() => handleViewImage(imageUrl)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                          >
                            <ExternalLink size={16} />
                            ดูรูปเต็ม
                          </button>
                        )}

                        {/* ปุ่มดาวน์โหลดไฟล์ E-book */}
                        {order.status === 'เสร็จสิ้น' && order.productFile && order.productCategory === 'E-book' && (
                          <a
                            href={order.productFile}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition"
                          >
                            <FileText size={16} />
                            ดาวน์โหลด E-book
                          </a>
                        )}

                        {/* แสดงว่าไม่มีไฟล์สำหรับ E-book */}
                        {order.status === 'เสร็จสิ้น' && !order.productFile && order.productCategory === 'E-book' && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600 opacity-50 cursor-not-allowed">
                            <FileText size={16} />
                            ไม่มีไฟล์
                          </div>
                        )}

                        {/* ดูโปรไฟล์ผู้ขาย */}
                        {order.sellerId && (
                          <Link
                            to={`/profile/${order.sellerId}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition"
                          >
                            ดูโปรไฟล์ผู้ขาย
                          </Link>
                        )}

                        {/* ลิงก์ไปหน้า Job Review สำหรับงาน Commission ที่รอยืนยัน */}
                        {order.jobId && order.status === 'รอดำเนินการ' && (
                          <Link
                            to={`/job/${order.jobId}/review`}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 transition"
                          >
                            <Eye size={16} />
                            ตรวจสอบงาน
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
