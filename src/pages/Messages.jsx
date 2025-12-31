import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { realtimeDb, db } from '../lib/firebase';
import { 
  ref, push, set, onValue, query, orderByChild, get, update, off
} from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MessageCircle, Search, Send, MoreVertical, 
  Phone, Video, Info, Image, Smile, Paperclip, AlertCircle, ArrowLeft
} from 'lucide-react';

export default function Messages() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);

  // ตรวจสอบ URL params สำหรับเปิดแชทกับผู้ใช้ใหม่
  useEffect(() => {
    const userId = searchParams.get('userId');
    const userName = searchParams.get('userName');
    
    if (userId && currentUser && userId !== currentUser.uid) {
      startOrOpenConversation(userId, userName || 'ผู้ใช้');
    }
  }, [searchParams, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const conversationsRef = ref(realtimeDb, `userConversations/${currentUser.uid}`);
      
      const unsubscribe = onValue(conversationsRef, async (snapshot) => {
        if (snapshot.exists()) {
          const convData = snapshot.val();
          const convList = await Promise.all(
            Object.entries(convData).map(async ([partnerId, conv]) => {
              const convId = getConversationId(currentUser.uid, partnerId);
              
              // Get last message
              const messagesRef = ref(realtimeDb, `messages/${convId}`);
              const messagesSnapshot = await get(query(messagesRef, orderByChild('timestamp')));
              let lastMessage = 'ไม่มีข้อความ';
              let lastTimestamp = conv.timestamp || Date.now();
              
              if (messagesSnapshot.exists()) {
                const msgs = Object.values(messagesSnapshot.val());
                const lastMsg = msgs[msgs.length - 1];
                lastMessage = lastMsg.text;
                lastTimestamp = lastMsg.timestamp;
              }

              // โหลดข้อมูลผู้ใช้จาก Firestore
              let userData = {
                id: partnerId,
                name: conv.userName || 'ผู้ใช้',
                avatar: conv.userAvatar || null,
                online: false
              };

              try {
                const userDoc = await getDoc(doc(db, 'users', partnerId));
                if (userDoc.exists()) {
                  const userProfile = userDoc.data();
                  userData = {
                    id: partnerId,
                    name: userProfile.displayName || userProfile.email?.split('@')[0] || 'ผู้ใช้',
                    avatar: userProfile.photoURL || null,
                    bio: userProfile.bio || '',
                    online: false
                  };
                }
              } catch (error) {
                console.error('Error loading user profile:', error);
              }

              return {
                id: convId,
                partnerId: partnerId,
                user: userData,
                lastMessage,
                timestamp: lastTimestamp,
                unread: conv.unread || 0
              };
            })
          );
          
          setConversations(convList.sort((a, b) => b.timestamp - a.timestamp));
        } else {
          setConversations([]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error loading conversations:", error);
        setLoading(false);
      });

      return () => off(conversationsRef);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation && currentUser) {
      const messagesRef = ref(realtimeDb, `messages/${selectedConversation.id}`);
      
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const msgsData = snapshot.val();
          const msgsList = Object.entries(msgsData).map(([id, msg]) => ({
            id,
            ...msg
          }));
          setMessages(msgsList.sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setMessages([]);
        }
      });

      // Reset unread count
      const myConvRef = ref(realtimeDb, `userConversations/${currentUser.uid}/${selectedConversation.partnerId}`);
      update(myConvRef, { unread: 0 });

      return () => off(messagesRef);
    }
  }, [selectedConversation, currentUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getConversationId = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  };

  const startOrOpenConversation = async (partnerId, partnerName, partnerAvatar = null) => {
    if (!currentUser || partnerId === currentUser.uid) return;

    const convId = getConversationId(currentUser.uid, partnerId);
    const myConvRef = ref(realtimeDb, `userConversations/${currentUser.uid}/${partnerId}`);
    const partnerConvRef = ref(realtimeDb, `userConversations/${partnerId}/${currentUser.uid}`);
    
    const snapshot = await get(myConvRef);
    
    if (!snapshot.exists()) {
      const timestamp = Date.now();
      
      await set(myConvRef, {
        userName: partnerName,
        userAvatar: partnerAvatar,
        timestamp: timestamp,
        unread: 0
      });
      
      await set(partnerConvRef, {
        userName: currentUser.displayName || 'ผู้ใช้',
        userAvatar: currentUser.photoURL || null,
        timestamp: timestamp,
        unread: 0
      });
    }

    setSelectedConversation({
      id: convId,
      partnerId: partnerId,
      user: { id: partnerId, name: partnerName, avatar: partnerAvatar }
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    const convId = selectedConversation.id;
    const partnerId = selectedConversation.partnerId;
    const messageRef = ref(realtimeDb, `messages/${convId}`);
    const newMsgRef = push(messageRef);
    const timestamp = Date.now();

    try {
      await set(newMsgRef, {
        senderId: currentUser.uid,
        text: newMessage.trim(),
        timestamp: timestamp
      });

      const myConvRef = ref(realtimeDb, `userConversations/${currentUser.uid}/${partnerId}`);
      const partnerConvRef = ref(realtimeDb, `userConversations/${partnerId}/${currentUser.uid}`);
      
      await update(myConvRef, { timestamp: timestamp });
      
      const partnerSnapshot = await get(partnerConvRef);
      const currentUnread = partnerSnapshot.exists() ? (partnerSnapshot.val().unread || 0) : 0;
      
      await update(partnerConvRef, { 
        timestamp: timestamp,
        unread: currentUnread + 1
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาที`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชม.`;
    return new Date(timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-4">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</p>
          <Link to="/login" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex pt-16">
      <div className={`${isMobileView && selectedConversation ? 'hidden' : 'flex'} w-full md:w-80 flex-col border-r border-[#2a2a2a]`}>
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold mb-4">ข้อความ</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาการสนทนา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mb-2"></div>
              <p>กำลังโหลด...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ไม่มีการสนทนา</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-[#2a2a2a] transition ${selectedConversation?.id === conv.id ? 'bg-[#2a2a2a]' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {conv.user.avatar ? <img src={conv.user.avatar} alt={conv.user.name} className="w-full h-full object-cover" /> : <span className="text-lg font-bold">{conv.user.name[0]?.toUpperCase()}</span>}
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{conv.user.name}</span>
                    <span className="text-xs text-gray-400">{formatTime(conv.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-xs px-2 py-1 rounded-full ml-2">{conv.unread}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3 bg-[#1a1a1a]">
            {isMobileView && (
              <button onClick={() => setSelectedConversation(null)} className="p-2 hover:bg-[#2a2a2a] rounded-lg transition">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {selectedConversation.user?.avatar ? <img src={selectedConversation.user.avatar} alt={selectedConversation.user.name} className="w-full h-full object-cover" /> : <span className="font-bold">{selectedConversation.user?.name?.[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <h3 className="font-medium">{selectedConversation.user?.name}</h3>
                <p className="text-xs text-gray-400">ออนไลน์</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>เริ่มการสนทนา</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.senderId === currentUser.uid ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'bg-[#2a2a2a] text-white'}`}>
                    <p className="break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === currentUser.uid ? 'text-white/70' : 'text-gray-400'}`}>{formatMessageTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="พิมพ์ข้อความ..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
              <button onClick={sendMessage} disabled={!newMessage.trim()} className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center text-gray-500">
            <MessageCircle className="w-20 h-20 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">เลือกการสนทนา</h3>
          </div>
        </div>
      )}
    </div>
  );
}
