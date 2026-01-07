import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { realtimeDb, db } from '../lib/firebase';
import { 
  ref, push, set, onValue, query, orderByChild, get
} from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MessageCircle, Search, Send, MoreVertical, 
  Phone, Video, Info, Image, Smile, Paperclip, AlertCircle
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function Messages() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation && currentUser) {
      subscribeToMessages(selectedConversation.id);
      resetUnread(selectedConversation.id);
    }
  }, [selectedConversation, currentUser]);

  const resetUnread = async (conversationId) => {
    if (!currentUser) return;
    const convRef = ref(realtimeDb, `conversations/${currentUser.uid}/${conversationId}`);
    try {
      const snapshot = await get(convRef);
      if (snapshot.exists()) {
        await set(ref(realtimeDb, `conversations/${currentUser.uid}/${conversationId}/unread`), 0);
      }
    } catch (error) {
      console.error('Error resetting unread:', error);
    }
  };

  // Auto-open chat when userId is passed via URL params
  useEffect(() => {
    const initChat = async () => {
      if (!currentUser) return;
      
      const userIdParam = searchParams.get('userId');
      const userNameParam = searchParams.get('userName');
      
      if (userIdParam) {
        // 1. Check in already loaded conversations
        const existingConv = conversations.find(conv => conv.user.id === userIdParam);
        if (existingConv) {
          setSelectedConversation(existingConv);
          return;
        }

        // 2. If not in list, check Realtime DB directly
        const convId = currentUser.uid < userIdParam 
          ? `${currentUser.uid}_${userIdParam}` 
          : `${userIdParam}_${currentUser.uid}`;
        const convRef = ref(realtimeDb, `conversations/${currentUser.uid}/${convId}`);
        const snapshot = await get(convRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          setSelectedConversation({
            id: convId,
            user: { 
              id: userIdParam, 
              name: data.userName || userNameParam || 'ผู้ใช้', 
              avatar: data.userAvatar || null, 
              online: data.online || false 
            },
            lastMessage: '',
            timestamp: data.timestamp || Date.now(),
            unread: 0
          });
        } else if (userNameParam) {
          // 3. Start new conversation if it doesn't exist anywhere
          startNewConversation(userIdParam, userNameParam);
        }
      }
    };

    initChat();
  }, [searchParams, currentUser, conversations.length > 0]);

  const loadConversations = async () => {
    if (!currentUser) return;

    const conversationsRef = ref(realtimeDb, `conversations/${currentUser.uid}`);
    
    onValue(conversationsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const convData = snapshot.val();
        let convList = await Promise.all(
          Object.entries(convData).map(async ([convId, conv]) => {
            // Get last message
            const messagesRef = ref(realtimeDb, `messages/${convId}`);
            const messagesSnapshot = await get(messagesRef);
            let lastMessage = 'ไม่มีข้อความ';
            let lastTimestamp = conv.timestamp || Date.now();
            
            if (messagesSnapshot.exists()) {
              const msgs = Object.values(messagesSnapshot.val());
              const lastMsg = msgs[msgs.length - 1];
              lastMessage = lastMsg.text;
              lastTimestamp = lastMsg.timestamp;
            }

            // โหลดข้อมูลจริงจาก Firestore
            let userData = {
              id: conv.userId,
              name: conv.userName || 'ผู้ใช้',
              avatar: conv.userAvatar || null,
              online: conv.online || false
            };

            // ตรวจสอบว่ามี userId ก่อนโหลดข้อมูล
            if (!conv.userId) {
              console.warn('Missing userId in conversation:', convId);
              return null;
            }

            try {
              const userDoc = await getDoc(doc(db, 'users', conv.userId));
              if (userDoc.exists()) {
                const userProfile = userDoc.data();
                userData = {
                  id: conv.userId,
                  name: userProfile.displayName || userProfile.email?.split('@')[0] || 'ผู้ใช้',
                  avatar: userProfile.photoURL || null,
                  bio: userProfile.bio || '',
                  online: conv.online || false
                };
              }
            } catch (error) {
              console.error('Error loading user profile:', error);
            }

            return {
              id: convId,
              user: userData,
              lastMessage,
              timestamp: lastTimestamp,
              unread: conv.unread || 0
            };
          })
        );
        
        // กรอง null ออก (จาก conversation ที่ไม่มี userId)
        convList = convList.filter(conv => conv !== null);
        
        setConversations(convList.sort((a, b) => b.timestamp - a.timestamp));
      }
      setLoading(false);
    });
  };



  const subscribeToMessages = (conversationId) => {
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`);
    
    return onValue(messagesRef, (snapshot) => {
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
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    const messageRef = ref(realtimeDb, `messages/${selectedConversation.id}`);
    const newMsgRef = push(messageRef);

    try {
      await set(newMsgRef, {
        senderId: currentUser.uid,
        text: newMessage.trim(),
        timestamp: Date.now()
      });

      // Update conversation for SENDER
      const senderConvRef = ref(realtimeDb, `conversations/${currentUser.uid}/${selectedConversation.id}`);
      const senderConvData = {
        userId: selectedConversation.user?.id || selectedConversation.userId,
        userName: selectedConversation.user?.name || selectedConversation.userName || 'ผู้ใช้',
        userAvatar: selectedConversation.user?.avatar || selectedConversation.userAvatar || null,
        online: selectedConversation.user?.online || selectedConversation.online || false,
        timestamp: Date.now(),
        unread: 0 // Reset unread for sender
      };
      await set(senderConvRef, senderConvData);

      // Update conversation for RECEIVER
      const receiverId = selectedConversation.user?.id || selectedConversation.userId;
      if (receiverId) {
        const receiverConvRef = ref(realtimeDb, `conversations/${receiverId}/${selectedConversation.id}`);
        
        // Get current unread count for receiver
        const receiverSnapshot = await get(receiverConvRef);
        let currentUnread = 0;
        if (receiverSnapshot.exists()) {
          currentUnread = receiverSnapshot.val().unread || 0;
        }

        const receiverConvData = {
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'ผู้ใช้',
          userAvatar: currentUser.photoURL || null,
          online: true, // Sender is online
          timestamp: Date.now(),
          unread: currentUnread + 1
        };
        await set(receiverConvRef, receiverConvData);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    }
  };

  const startNewConversation = async (userId, userName) => {
    if (!currentUser) return;

    // Use a consistent conversation ID format: smallerUID_largerUID
    const convId = currentUser.uid < userId 
      ? `${currentUser.uid}_${userId}` 
      : `${userId}_${currentUser.uid}`;
      
    const senderConvRef = ref(realtimeDb, `conversations/${currentUser.uid}/${convId}`);
    
    try {
      // Create/Update for sender
      await set(senderConvRef, {
        userId,
        userName,
        userAvatar: null,
        online: false,
        timestamp: Date.now(),
        unread: 0
      });

      setSelectedConversation({
        id: convId,
        user: { id: userId, name: userName, avatar: null, online: false },
        lastMessage: '',
        timestamp: Date.now(),
        unread: 0
      });
    } catch (error) {
      console.error('Error starting new conversation:', error);
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาที`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชม.`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} วัน`;
    return new Date(timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex pt-16">
      {/* Conversations List */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col">
        {/* Header */}
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

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">กำลังโหลด...</div>
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
                className={`w-full p-4 flex items-center gap-3 hover:bg-[#2a2a2a] transition ${
                  selectedConversation?.id === conv.id ? 'bg-[#2a2a2a]' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <UserAvatar 
                    userId={conv.user.id} 
                    className="w-12 h-12" 
                  />
                  {conv.user.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]"></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{conv.user.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between bg-[#1a1a1a]">
            <Link 
              to={`/profile/${selectedConversation.user.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <UserAvatar 
                userId={selectedConversation.user.id} 
                className="w-10 h-10" 
              />
              <div>
                <UserAvatar 
                  userId={selectedConversation.user.id} 
                  showName={true} 
                  className="hidden" 
                  nameClassName="font-medium hover:text-purple-400 transition"
                />
                <div className="text-xs text-gray-400">
                  {selectedConversation.user.online ? 'ออนไลน์' : 'ออฟไลน์'}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#2a2a2a] rounded-full transition">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded-full transition">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded-full transition">
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>เริ่มการสนทนา</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-2xl ${
                      msg.senderId === currentUser.uid
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-[#2a2a2a] text-white'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
            {/* คำเตือน */}
            <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-xs text-yellow-400 flex items-center gap-2">
                <AlertCircle size={14} />
                ห้ามส่งไฟล์หรือรูปภาพในแชท กรุณาใช้ระบบ Escrow เพื่อความปลอดภัย
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="พิมพ์ข้อความ... (ส่งได้เฉพาะข้อความเท่านั้น)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-full px-4 py-2 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">เลือกการสนทนาเพื่อเริ่มแชท</p>
          </div>
        </div>
      )}
    </div>
  );
}
