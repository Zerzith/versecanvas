# คู่มือการใช้งาน Firebase Security Rules - VerseCanvas

## 📋 ภาพรวม

เอกสารนี้อธิบายการตั้งค่า Firebase Security Rules สำหรับระบบ VerseCanvas ทั้ง Firestore และ Realtime Database

---

## 🔥 Firestore Security Rules

### ไฟล์: `firestore.rules`

Firestore Rules ควบคุมการเข้าถึงข้อมูลใน Cloud Firestore ซึ่งเป็นฐานข้อมูลหลักของระบบ

### Collections ที่ครอบคลุม

| Collection | อ่าน | สร้าง | แก้ไข | ลบ |
|-----------|------|-------|-------|-----|
| **users** | ทุกคน | เจ้าของ | เจ้าของ/Admin | เจ้าของ/Admin |
| **stories** | ทุกคน | ผู้ใช้ที่ล็อกอิน | เจ้าของ/Admin | เจ้าของ/Admin |
| **stories/{id}/chapters** | ทุกคน | เจ้าของเรื่อง | เจ้าของเรื่อง | เจ้าของเรื่อง |
| **artworks** | ทุกคน | ผู้ใช้ที่ล็อกอิน | เจ้าของ/Admin | เจ้าของ/Admin |
| **products** | ทุกคน | ผู้ใช้ที่ล็อกอิน | เจ้าของ/Admin | เจ้าของ/Admin |
| **jobs** | ทุกคน | ผู้ใช้ที่ล็อกอิน | เจ้าของ/Admin/ศิลปิน | เจ้าของ/Admin |
| **artRequests** | ทุกคน | ผู้ใช้ที่ล็อกอิน | เจ้าของ/Admin | เจ้าของ/Admin |
| **orders** | ผู้ซื้อ/ผู้ขาย/Admin | ผู้ซื้อ | ผู้ขาย/Admin | Admin |
| **workSubmissions** | ศิลปิน/ลูกค้า/Admin | ศิลปิน | ศิลปิน/Admin | Admin |
| **transactions** | เจ้าของ/Admin | เจ้าของ | Admin | Admin |
| **withdrawals** | เจ้าของ/Admin | เจ้าของ | Admin | Admin |
| **notifications** | เจ้าของ | ทุกคน | เจ้าของ | เจ้าของ/Admin |
| **bookmarks** | เจ้าของ | เจ้าของ | เจ้าของ | เจ้าของ |
| **follows** | ทุกคน | ผู้ติดตาม | - | ผู้ติดตาม |
| **likes** | ทุกคน | เจ้าของ | - | เจ้าของ |
| **comments** | ทุกคน | ผู้ใช้ที่ล็อกอิน | เจ้าของ/Admin | เจ้าของ/Admin |
| **reports** | Admin | ผู้ใช้ที่ล็อกอิน | Admin | Admin |
| **reviews** | ทุกคน | ผู้ใช้ที่ล็อกอิน | เจ้าของ/Admin | เจ้าของ/Admin |

### Helper Functions

#### `isSignedIn()`
ตรวจสอบว่าผู้ใช้ล็อกอินแล้ว

```javascript
function isSignedIn() {
  return request.auth != null;
}
```

#### `isOwner(userId)`
ตรวจสอบว่าเป็นเจ้าของเอกสาร

```javascript
function isOwner(userId) {
  return isSignedIn() && request.auth.uid == userId;
}
```

#### `isAdmin()`
ตรวจสอบว่าเป็น Admin

```javascript
function isAdmin() {
  return isSignedIn() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

#### `isValidUser()`
ตรวจสอบว่าข้อมูลที่จะเขียนมี userId ตรงกับผู้ใช้ปัจจุบัน

```javascript
function isValidUser() {
  return request.resource.data.userId == request.auth.uid;
}
```

### ตัวอย่างการใช้งาน

#### 1. Users Collection
```javascript
match /users/{userId} {
  allow read: if true;  // อ่านได้ทุกคน
  allow create: if isSignedIn() && request.auth.uid == userId;
  allow update: if isOwner(userId) || isAdmin();
  allow delete: if isOwner(userId) || isAdmin();
}
```

#### 2. Stories Collection (พร้อม Subcollection)
```javascript
match /stories/{storyId} {
  allow read: if true;
  allow create: if isSignedIn() && isValidUser();
  allow update: if isOwner(resource.data.userId) || isAdmin();
  allow delete: if isOwner(resource.data.userId) || isAdmin();
  
  match /chapters/{chapterId} {
    allow read: if true;
    allow create: if isSignedIn() && 
                     isOwner(get(/databases/$(database)/documents/stories/$(storyId)).data.userId);
    allow update: if isSignedIn() && 
                     isOwner(get(/databases/$(database)/documents/stories/$(storyId)).data.userId);
    allow delete: if isSignedIn() && 
                     isOwner(get(/databases/$(database)/documents/stories/$(storyId)).data.userId);
  }
}
```

#### 3. Jobs Collection (Escrow)
```javascript
match /jobs/{jobId} {
  allow read: if true;
  allow create: if isSignedIn() && isValidUser();
  allow update: if isOwner(resource.data.userId) || 
                   isAdmin() ||
                   (isSignedIn() && request.auth.uid == resource.data.acceptedFreelancerId);
  allow delete: if isOwner(resource.data.userId) || isAdmin();
}
```

---

## 🔄 Realtime Database Security Rules

### ไฟล์: `database.rules.json`

Realtime Database Rules ควบคุมการเข้าถึงข้อมูลใน Firebase Realtime Database ซึ่งใช้สำหรับ Real-time Features

### Paths ที่ครอบคลุม

| Path | อ่าน | เขียน | คำอธิบาย |
|------|------|-------|----------|
| **messages/{conversationId}** | คนในห้องแชท | คนในห้องแชท | ข้อความแชท |
| **status/{userId}** | ทุกคน | เจ้าของ | สถานะออนไลน์ |
| **typing/{conversationId}/{userId}** | คนในห้องแชท | เจ้าของ | สถานะกำลังพิมพ์ |
| **notifications/{userId}** | เจ้าของ | ทุกคน | การแจ้งเตือนแบบ real-time |
| **presence/{userId}** | ทุกคน | เจ้าของ | การติดตามสถานะ |
| **conversations/{userId}** | เจ้าของ | เจ้าของ | Metadata ของการสนทนา |
| **views/{contentType}/{contentId}** | ทุกคน | ผู้ใช้ที่ล็อกอิน | การดู |
| **likes/{contentType}/{contentId}** | ทุกคน | ผู้ใช้ที่ล็อกอิน | การถูกใจ |
| **follows/{userId}** | ทุกคน | ผู้ใช้ที่ล็อกอิน | การติดตาม |
| **liveUpdates/jobs/{jobId}** | ทุกคน | ผู้ที่เกี่ยวข้อง | อัปเดตงานแบบ real-time |
| **liveUpdates/orders/{orderId}** | ผู้ที่เกี่ยวข้อง | ผู้ที่เกี่ยวข้อง | อัปเดตคำสั่งซื้อแบบ real-time |

### โครงสร้างข้อมูล

#### 1. Messages
```json
{
  "messages": {
    "conversationId": {
      "participants": {
        "userId1": true,
        "userId2": true
      },
      "messages": {
        "messageId": {
          "senderId": "userId",
          "text": "ข้อความ",
          "timestamp": 1234567890,
          "imageUrl": "url",
          "fileUrl": "url",
          "read": false
        }
      },
      "lastMessage": {
        "text": "ข้อความล่าสุด",
        "timestamp": 1234567890,
        "senderId": "userId"
      }
    }
  }
}
```

#### 2. Status (สถานะออนไลน์)
```json
{
  "status": {
    "userId": {
      "state": "online",
      "lastChanged": 1234567890
    }
  }
}
```

#### 3. Typing Indicators
```json
{
  "typing": {
    "conversationId": {
      "userId": true
    }
  }
}
```

#### 4. Presence
```json
{
  "presence": {
    "userId": {
      "online": true,
      "lastSeen": 1234567890
    }
  }
}
```

#### 5. Conversations Metadata
```json
{
  "conversations": {
    "userId": {
      "conversationId": {
        "otherUserId": "userId2",
        "lastMessageTime": 1234567890,
        "unreadCount": 5,
        "lastMessage": "ข้อความล่าสุด"
      }
    }
  }
}
```

### Validation Rules

#### Messages
- `senderId` ต้องตรงกับ `auth.uid`
- `text` ต้องมีความยาว 1-5000 ตัวอักษร
- `timestamp` ต้องเป็นตัวเลข

#### Status
- `state` ต้องเป็น "online" หรือ "offline" เท่านั้น
- `lastChanged` ต้องเป็นตัวเลข

#### Typing
- ค่าต้องเป็น boolean

---

## 🚀 การ Deploy Rules

### 1. Deploy Firestore Rules

```bash
# ผ่าน Firebase CLI
firebase deploy --only firestore:rules

# หรือผ่าน Firebase Console
# ไปที่ Firestore Database > Rules > แก้ไขและเผยแพร่
```

### 2. Deploy Realtime Database Rules

```bash
# ผ่าน Firebase CLI
firebase deploy --only database

# หรือผ่าน Firebase Console
# ไปที่ Realtime Database > Rules > แก้ไขและเผยแพร่
```

### 3. Deploy ทั้งหมด

```bash
firebase deploy --only firestore:rules,database
```

---

## 🧪 การทดสอบ Rules

### Firestore Rules

```bash
# ติดตั้ง Firebase Emulator
npm install -g firebase-tools

# เริ่ม Emulator
firebase emulators:start

# ทดสอบ Rules
firebase emulators:exec --only firestore "npm test"
```

### Realtime Database Rules

```bash
# เริ่ม Emulator
firebase emulators:start

# ทดสอบผ่าน UI
# เปิด http://localhost:4000
```

---

## ⚠️ ข้อควรระวัง

### 1. Admin Role
- ต้องตั้งค่า `role: 'admin'` ใน `users` collection ก่อน
- Admin มีสิทธิ์เข้าถึงข้อมูลทั้งหมด

### 2. Performance
- ใช้ `get()` น้อยที่สุด เพราะมีค่าใช้จ่าย
- ใช้ `exists()` แทน `get()` เมื่อเป็นไปได้

### 3. Security
- ตรวจสอบ `userId` ทุกครั้งก่อนเขียนข้อมูล
- ใช้ `isValidUser()` สำหรับการสร้างเอกสารใหม่

### 4. Subcollections
- Rules ของ parent ไม่มีผลกับ subcollection
- ต้องกำหนด Rules แยกสำหรับ subcollection

---

## 📊 ตัวอย่างการใช้งานในโค้ด

### Firestore

```javascript
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// อ่านข้อมูล (ผ่าน Rules)
const userDoc = await getDoc(doc(db, 'users', userId));

// สร้างข้อมูล (ต้องมี userId)
await setDoc(doc(db, 'stories', storyId), {
  userId: currentUser.uid,
  title: 'ชื่อเรื่อง',
  // ...
});

// แก้ไขข้อมูล (ต้องเป็นเจ้าของ)
await updateDoc(doc(db, 'stories', storyId), {
  title: 'ชื่อใหม่'
});

// ลบข้อมูล (ต้องเป็นเจ้าของ)
await deleteDoc(doc(db, 'stories', storyId));
```

### Realtime Database

```javascript
import { ref, set, get, onValue, off } from 'firebase/database';
import { rtdb } from './firebase';

// อ่านข้อมูล
const snapshot = await get(ref(rtdb, `messages/${conversationId}`));

// เขียนข้อมูล
await set(ref(rtdb, `status/${userId}`), {
  state: 'online',
  lastChanged: Date.now()
});

// ฟังการเปลี่ยนแปลง
const messagesRef = ref(rtdb, `messages/${conversationId}/messages`);
onValue(messagesRef, (snapshot) => {
  const messages = snapshot.val();
  // ...
});

// หยุดฟัง
off(messagesRef);
```

---

## 🔍 การแก้ปัญหา

### ปัญหา: Permission Denied

**สาเหตุ:**
- ผู้ใช้ไม่ได้ล็อกอิน
- ไม่มีสิทธิ์เข้าถึงข้อมูล
- `userId` ไม่ตรงกัน

**วิธีแก้:**
1. ตรวจสอบว่าผู้ใช้ล็อกอินแล้ว
2. ตรวจสอบ `userId` ในข้อมูล
3. ตรวจสอบ Rules ว่าถูกต้อง

### ปัญหา: Rules ไม่ทำงาน

**สาเหตุ:**
- Rules ยังไม่ Deploy
- Syntax ผิด
- ใช้ฟิลด์ผิด

**วิธีแก้:**
1. Deploy Rules ใหม่
2. ตรวจสอบ Syntax
3. ใช้ Firebase Emulator ทดสอบ

---

## 📝 สรุป

Firebase Security Rules เป็นชั้นความปลอดภัยสำคัญของระบบ VerseCanvas ที่ควบคุมการเข้าถึงข้อมูลทั้งใน Firestore และ Realtime Database

**จุดสำคัญ:**
- ✅ ตรวจสอบสิทธิ์ทุกครั้งก่อนเข้าถึงข้อมูล
- ✅ ใช้ Helper Functions เพื่อความชัดเจน
- ✅ Validate ข้อมูลก่อนเขียน
- ✅ ทดสอบ Rules ก่อน Deploy
- ✅ อัปเดต Rules เมื่อเพิ่มฟีเจอร์ใหม่

---

**วันที่อัปเดต:** 15 พฤศจิกายน 2025  
**เวอร์ชัน:** v2.3.0  
**ผู้จัดทำ:** Manus AI Agent
