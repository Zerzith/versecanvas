import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import { Bookmark, BookOpen, Palette, ShoppingBag, Trash2, RefreshCw } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Bookmarks() {
  const { currentUser } = useAuth();
  const { getBookmarks, bookmarkPost } = useSocial();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (currentUser) {
      loadBookmarks();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      // ดึง bookmarks จาก Realtime Database
      const bookmarksData = await getBookmarks();
      
      // ดึงข้อมูลเพิ่มเติมสำหรับแต่ละ bookmark
      const enrichedBookmarks = await Promise.all(
        bookmarksData.map(async (bookmark) => {
          let itemData = {};
          
          try {
            // ดึงข้อมูลจาก Firestore ตาม postType
            let collectionName = '';
            switch (bookmark.postType) {
              case 'story':
                collectionName = 'stories';
                break;
              case 'artwork':
                collectionName = 'artworks';
                break;
              case 'product':
                collectionName = 'products';
                break;
              default:
                collectionName = 'artworks';
            }
            
            const docRef = doc(db, collectionName, bookmark.postId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const data = docSnap.data();
              itemData = {
                title: data.title || data.name || 'ไม่มีชื่อ',
                image: data.coverImage || data.image || data.imageUrl || '',
                author: data.authorName || data.author || ''
              };
            }
          } catch (e) {
            console.log('Could not fetch item data:', e);
          }
          
          return {
            ...bookmark,
            itemType: bookmark.postType,
            itemId: bookmark.postId,
            itemData
          };
        })
      );
      
      setBookmarks(enrichedBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', count: bookmarks.length },
    { id: 'story', label: 'นิยาย', count: bookmarks.filter(b => b.itemType === 'story').length },
    { id: 'artwork', label: 'ผลงาน', count: bookmarks.filter(b => b.itemType === 'artwork').length },
    { id: 'product', label: 'สินค้า', count: bookmarks.filter(b => b.itemType === 'product').length }
  ];

  const filteredBookmarks = activeTab === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.itemType === activeTab);

  const handleRemove = async (itemId, itemType) => {
    if (confirm('ต้องการลบรายการที่บันทึกไว้นี้?')) {
      await bookmarkPost(itemId, itemType);
      // รีโหลด bookmarks
      loadBookmarks();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'story': return <BookOpen size={20} className="text-blue-400" />;
      case 'artwork': return <Palette size={20} className="text-pink-400" />;
      case 'product': return <ShoppingBag size={20} className="text-green-400" />;
      default: return <Bookmark size={20} />;
    }
  };

  const getLink = (bookmark) => {
    switch (bookmark.itemType) {
      case 'story': return `/story/${bookmark.itemId}`;
      case 'artwork': return `/artworks`;
      case 'product': return `/shop`;
      default: return '#';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'ไม่ทราบ';
    const date = new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-20">
            <Bookmark className="w-20 h-20 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">กรุณาเข้าสู่ระบบ</h3>
            <p className="text-gray-400 mb-6">เข้าสู่ระบบเพื่อดูรายการที่บันทึกไว้</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Bookmark size={32} />
              รายการที่บันทึกไว้
            </h1>
            <p className="text-gray-400">ผลงานและเนื้อหาที่คุณบันทึกไว้</p>
          </div>
          <button
            onClick={loadBookmarks}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
          >
            <RefreshCw size={16} />
            รีเฟรช
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto mb-8 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-20 h-20 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">ยังไม่มีรายการที่บันทึกไว้</h3>
            <p className="text-gray-400 mb-6">เริ่มบันทึกผลงานที่คุณชอบเพื่อดูภายหลัง</p>
            <Link
              to="/explore"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition"
            >
              สำรวจผลงาน
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map((bookmark, index) => (
              <div
                key={`${bookmark.itemId}-${index}`}
                className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2a2a2a] hover:border-purple-500 transition group"
              >
                {/* Image */}
                {bookmark.itemData?.image && (
                  <Link to={getLink(bookmark)} className="block aspect-video overflow-hidden bg-[#2a2a2a]">
                    <img
                      src={bookmark.itemData.image}
                      alt={bookmark.itemData.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </Link>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Link to={getLink(bookmark)} className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getIcon(bookmark.itemType)}
                        <span className="text-xs text-gray-400 uppercase">
                          {bookmark.itemType === 'story' ? 'นิยาย' : 
                           bookmark.itemType === 'artwork' ? 'ผลงาน' : 'สินค้า'}
                        </span>
                      </div>
                      <h3 className="font-bold line-clamp-2 group-hover:text-purple-400 transition">
                        {bookmark.itemData?.title || 'ไม่มีชื่อ'}
                      </h3>
                      {bookmark.itemData?.author && (
                        <p className="text-sm text-gray-400 mt-1">
                          โดย {bookmark.itemData.author}
                        </p>
                      )}
                    </Link>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(bookmark.itemId, bookmark.itemType)}
                      className="p-2 rounded-lg hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition"
                      title="ลบ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-500">
                    บันทึกเมื่อ {formatDate(bookmark.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
