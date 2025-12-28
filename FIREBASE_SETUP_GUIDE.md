# คู่มือตั้งค่า Firebase สำหรับ VerseCanvas

## 📋 ข้อมูล Firebase ที่ใช้

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCifJfDFC_JZIVLdUMPhObVdhk-39lYj_k",
  authDomain: "versecanvas-a9b76.firebaseapp.com",
  projectId: "versecanvas-a9b76",
  storageBucket: "versecanvas-a9b76.firebasestorage.app",
  messagingSenderId: "40464293145",
  appId: "1:40464293145:web:e908fdd0f2b0f6f051b988"
};
```

**Realtime Database URL:**
```
https://versecanvas-a9b76-default-rtdb.asia-southeast1.firebasedatabase.app/
```

---

## 🔧 ขั้นตอนการตั้งค่า Firebase

### 1. เปิดใช้งาน Authentication

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจค `versecanvas-a9b76`
3. ไปที่ **Authentication** → **Sign-in method**
4. เปิดใช้งาน:
   - ✅ **Email/Password**
   - ✅ **Google** (ถ้าต้องการ)

### 2. ตั้งค่า Firestore Database

1. ไปที่ **Firestore Database**
2. คลิก **Create database**
3. เลือก **Start in production mode** (หรือ test mode สำหรับพัฒนา)
4. เลือก Location: **asia-southeast1** (Singapore)

#### สร้าง Collections

สร้าง Collections ต่อไปนี้:

- `users` - ข้อมูลผู้ใช้
- `stories` - นิยาย
- `chapters` - ตอนนิยาย
- `artworks` - ผลงานศิลปะ
- `products` - สินค้าในร้านค้า
- `jobs` - งานใน Artseek
- `orders` - คำสั่งซื้อ
- `transactions` - ธุรกรรม
- `notifications` - การแจ้งเตือน
- `bookmarks` - รายการบุ๊คมาร์ค
- `escrow` - ข้อมูล Escrow
- `withdrawals` - คำขอถอนเงิน
- `follows` - การติดตาม
- `likes` - การถูกใจ
- `comments` - ความคิดเห็น

#### ตั้งค่า Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stories collection
    match /stories/{storyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
    
    // Chapters collection
    match /chapters/{chapterId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
    
    // Artworks collection
    match /artworks/{artworkId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.artistId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.sellerId;
    }
    
    // Jobs collection
    match /jobs/{jobId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.acceptedFreelancerId);
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.buyerId || 
         request.auth.uid == resource.data.sellerId);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.sellerId;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read, update: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Bookmarks collection
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Escrow collection
    match /escrow/{escrowId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.clientId || 
         request.auth.uid == resource.data.freelancerId);
      allow create, update: if request.auth != null;
    }
    
    // Withdrawals collection
    match /withdrawals/{withdrawalId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Social features
    match /follows/{followId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /likes/{likeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3. ตั้งค่า Realtime Database

1. ไปที่ **Realtime Database**
2. คลิก **Create Database**
3. เลือก Location: **asia-southeast1**
4. เลือก **Start in locked mode**

#### ตั้งค่า Security Rules

```json
{
  "rules": {
    "messages": {
      "$conversationId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "conversations": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

### 4. ตั้งค่า Storage

1. ไปที่ **Storage**
2. คลิก **Get started**
3. เลือก **Start in production mode**
4. เลือก Location: **asia-southeast1**

#### ตั้งค่า Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. สร้าง Indexes สำหรับ Firestore

ไปที่ **Firestore Database** → **Indexes** และสร้าง Composite Indexes:

#### Orders Index
- Collection: `orders`
- Fields:
  - `buyerId` (Ascending)
  - `createdAt` (Descending)

#### Jobs Index (Client)
- Collection: `jobs`
- Fields:
  - `userId` (Ascending)
  - `escrowLocked` (Ascending)
  - `createdAt` (Descending)

#### Jobs Index (Freelancer)
- Collection: `jobs`
- Fields:
  - `acceptedFreelancerId` (Ascending)
  - `escrowLocked` (Ascending)
  - `createdAt` (Descending)

#### Transactions Index
- Collection: `transactions`
- Fields:
  - `userId` (Ascending)
  - `createdAt` (Descending)

#### Notifications Index
- Collection: `notifications`
- Fields:
  - `userId` (Ascending)
  - `read` (Ascending)
  - `createdAt` (Descending)

---

## 🔐 ตั้งค่า Cloudinary

**ข้อมูล Cloudinary:**
- Cloud Name: `ds5t11i5v`
- Upload Preset: `CommissionArt`

### ขั้นตอนการตั้งค่า Cloudinary

1. ไปที่ [Cloudinary Console](https://cloudinary.com/console)
2. ไปที่ **Settings** → **Upload**
3. สร้าง Upload Preset:
   - Preset Name: `CommissionArt`
   - Signing Mode: **Unsigned**
   - Folder: `versecanvas`
   - Access Mode: **Public**

---

## 📝 ตัวอย่างข้อมูลใน Firestore

### Users Collection

```json
{
  "uid": "user123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://example.com/photo.jpg",
  "bio": "นักเขียนและศิลปิน",
  "credits": 100,
  "followers": 10,
  "following": 5,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Stories Collection

```json
{
  "title": "เรื่องราวแห่งความฝัน",
  "description": "นิยายแฟนตาซีที่น่าติดตาม",
  "coverImage": "https://cloudinary.com/...",
  "category": "แฟนตาซี",
  "status": "กำลังเขียน",
  "chapters": 10,
  "authorId": "user123",
  "authorName": "John Doe",
  "authorAvatar": "https://example.com/avatar.jpg",
  "views": 1000,
  "likes": 50,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-10T00:00:00Z"
}
```

### Artworks Collection

```json
{
  "title": "Sunset Dreams",
  "description": "ภาพวาดพระอาทิตย์ตก",
  "imageUrl": "https://cloudinary.com/...",
  "category": "ภาพวาด",
  "tags": ["sunset", "landscape", "painting"],
  "artistId": "user123",
  "artistName": "John Doe",
  "views": 500,
  "likes": 25,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Products Collection

```json
{
  "title": "Digital Art Pack",
  "description": "ชุดภาพดิจิทัลอาร์ต",
  "image": "https://cloudinary.com/...",
  "price": 99,
  "quantity": 10,
  "soldCount": 3,
  "fileUrl": "https://cloudinary.com/file.zip",
  "sellerId": "user123",
  "seller": "John Doe",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 🚀 การทดสอบ

### 1. ทดสอบ Authentication
```bash
# เปิดเว็บไซต์
npm run dev

# ลองสมัครสมาชิกใหม่
# ลองเข้าสู่ระบบ
# ตรวจสอบว่ามีข้อมูลใน Firebase Authentication
```

### 2. ทดสอบ Firestore
```bash
# สร้างนิยาย
# ตรวจสอบว่ามีข้อมูลใน Firestore → stories collection

# อัปโหลดผลงาน
# ตรวจสอบว่ามีข้อมูลใน Firestore → artworks collection
```

### 3. ทดสอบ Realtime Database
```bash
# ส่งข้อความ
# ตรวจสอบว่ามีข้อมูลใน Realtime Database → messages
```

### 4. ทดสอบ Storage
```bash
# อัปโหลดรูปโปรไฟล์
# ตรวจสอบว่ามีไฟล์ใน Firebase Storage
```

---

## ⚠️ ข้อควรระวัง

1. **Security Rules** - ตรวจสอบให้แน่ใจว่าตั้งค่า Security Rules ถูกต้อง
2. **Indexes** - สร้าง Indexes ที่จำเป็นเพื่อให้ Query ทำงานได้
3. **Billing** - ตรวจสอบ Quota และ Billing ของ Firebase
4. **Backup** - สำรองข้อมูลเป็นประจำ

---

## 📞 การแก้ปัญหา

### ปัญหา: ไม่สามารถ Query ได้
**แก้ไข:** สร้าง Composite Index ตามที่ Firebase แจ้งเตือน

### ปัญหา: Permission Denied
**แก้ไข:** ตรวจสอบ Security Rules และแก้ไขให้ถูกต้อง

### ปัญหา: ข้อมูลไม่แสดง
**แก้ไข:** 
1. ตรวจสอบ Console (F12) หา Error
2. ตรวจสอบว่ามีข้อมูลใน Firestore หรือไม่
3. ตรวจสอบ Network Tab ว่า Request สำเร็จหรือไม่

---

## ✅ Checklist การตั้งค่า

- [ ] เปิดใช้งาน Authentication (Email/Password)
- [ ] สร้าง Firestore Database
- [ ] สร้าง Collections ทั้งหมด
- [ ] ตั้งค่า Firestore Security Rules
- [ ] สร้าง Composite Indexes
- [ ] เปิดใช้งาน Realtime Database
- [ ] ตั้งค่า Realtime Database Rules
- [ ] เปิดใช้งาน Storage
- [ ] ตั้งค่า Storage Rules
- [ ] ตั้งค่า Cloudinary Upload Preset
- [ ] ทดสอบการทำงานทั้งหมด

---

**สร้างเมื่อ:** 13 พฤศจิกายน 2568  
**เวอร์ชัน:** 1.0  
**สถานะ:** พร้อมใช้งาน
