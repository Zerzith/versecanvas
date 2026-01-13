import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BookOpen, Palette, Search, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState('stories');
  const [stories, setStories] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    const content = activeTab === 'stories' ? stories : artworks;
    if (searchTerm) {
      const filtered = content.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContent(filtered);
    } else {
      setFilteredContent(content);
    }
  }, [searchTerm, activeTab, stories, artworks]);

  const fetchContent = async () => {
    try {
      // Fetch stories
      const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
      const storiesSnap = await getDocs(storiesQuery);
      const storiesData = await Promise.all(
        storiesSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Get author name
          let authorName = 'Unknown';
          if (data.authorId) {
            try {
              const authorDoc = await getDocs(query(collection(db, 'users')));
              const author = authorDoc.docs.find(d => d.id === data.authorId);
              if (author) {
                authorName = author.data().displayName || 'Unknown';
              }
            } catch (error) {
              console.error('Error fetching author:', error);
            }
          }
          return {
            id: docSnap.id,
            ...data,
            authorName
          };
        })
      );
      setStories(storiesData);

      // Fetch artworks
      const artworksQuery = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'));
      const artworksSnap = await getDocs(artworksQuery);
      const artworksData = await Promise.all(
        artworksSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Get author name
          let authorName = 'Unknown';
          if (data.userId) {
            try {
              const authorDoc = await getDocs(query(collection(db, 'users')));
              const author = authorDoc.docs.find(d => d.id === data.userId);
              if (author) {
                authorName = author.data().displayName || 'Unknown';
              }
            } catch (error) {
              console.error('Error fetching author:', error);
            }
          }
          return {
            id: docSnap.id,
            ...data,
            authorName
          };
        })
      );
      setArtworks(artworksData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!confirm('คุณต้องการลบนิยายนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!')) return;

    try {
      // Delete all chapters first
      const chaptersSnap = await getDocs(collection(db, 'chapters'));
      const storyChapters = chaptersSnap.docs.filter(doc => doc.data().storyId === storyId);
      await Promise.all(storyChapters.map(doc => deleteDoc(doc.ref)));

      // Delete story
      await deleteDoc(doc(db, 'stories', storyId));
      setStories(stories.filter(s => s.id !== storyId));
      toast.success('ลบนิยายสำเร็จ!');
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!confirm('คุณต้องการลบผลงานนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!')) return;

    try {
      await deleteDoc(doc(db, 'artworks', artworkId));
      setArtworks(artworks.filter(a => a.id !== artworkId));
      toast.success('ลบผลงานสำเร็จ!');
    } catch (error) {
      console.error('Error deleting artwork:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  const handleToggleVisibility = async (id, currentStatus, type) => {
    try {
      const collectionName = type === 'story' ? 'stories' : 'artworks';
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        hidden: !currentStatus,
        updatedAt: new Date()
      });

      if (type === 'story') {
        setStories(stories.map(s => 
          s.id === id ? { ...s, hidden: !currentStatus } : s
        ));
      } else {
        setArtworks(artworks.map(a => 
          a.id === id ? { ...a, hidden: !currentStatus } : a
        ));
      }

      toast.success(`${currentStatus ? 'แสดง' : 'ซ่อน'}เนื้อหาสำเร็จ!');
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">จัดการเนื้อหา</h1>
          <p className="text-gray-400">จัดการนิยาย ตอน และผลงานศิลปะ</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'stories'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
            }`}
          >
            <BookOpen size={20} />
            <span>นิยาย ({stories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('artworks')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'artworks'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
            }`}
          >
            <Palette size={20} />
            <span>ผลงานศิลปะ ({artworks.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`ค้นหา${activeTab === 'stories' ? 'นิยาย' : 'ผลงาน'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {activeTab === 'stories' ? 'นิยาย' : 'ผลงาน'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    ผู้สร้าง
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.coverImage && (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-white">{item.title || 'Untitled'}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {item.description || item.genre || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {item.authorName}
                    </td>
                    <td className="px-6 py-4">
                      {item.hidden ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          ซ่อน
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          แสดง
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {item.createdAt?.toDate().toLocaleDateString('th-TH') || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={activeTab === 'stories' ? `/story/${item.id}` : `/artwork/${item.id}`}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                          title="ดู"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => handleToggleVisibility(
                            item.id, 
                            item.hidden, 
                            activeTab === 'stories' ? 'story' : 'artwork'
                          )}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-yellow-400 hover:text-yellow-300"
                          title={item.hidden ? 'แสดง' : 'ซ่อน'}
                        >
                          <AlertCircle size={18} />
                        </button>
                        <button
                          onClick={() => 
                            activeTab === 'stories' 
                              ? handleDeleteStory(item.id)
                              : handleDeleteArtwork(item.id)
                          }
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-12">
              {activeTab === 'stories' ? (
                <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              ) : (
                <Palette className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              )}
              <p className="text-gray-400">ไม่พบเนื้อหา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
