# 🚀 คู่มือการ Deploy VerseCanvas

## 📋 สิ่งที่ต้องเตรียมก่อน Deploy

### 1. ตรวจสอบไฟล์ที่จำเป็น
- ✅ `.env` - มีค่า Firebase และ Cloudinary ครบถ้วน
- ✅ `package.json` - dependencies ครบถ้วน
- ✅ Build ผ่าน (`npm run build`)

### 2. Firebase Setup
ตรวจสอบว่าได้ตั้งค่า Firebase แล้ว:
- ✅ Firestore Database
- ✅ Realtime Database
- ✅ Storage
- ✅ Authentication (Email/Password)

### 3. Cloudinary Setup
ตรวจสอบว่าได้ตั้งค่า Cloudinary แล้ว:
- ✅ Cloud Name: `ds5t11i5v`
- ✅ Upload Preset: `CommissionArt`

---

## 🌐 วิธีการ Deploy

### Option 1: Vercel (แนะนำ - ง่ายที่สุด)

#### ขั้นตอนที่ 1: ติดตั้ง Vercel CLI
```bash
npm install -g vercel
```

#### ขั้นตอนที่ 2: Login เข้า Vercel
```bash
vercel login
```

#### ขั้นตอนที่ 3: Deploy
```bash
cd /home/ubuntu/versecanvas-final
vercel
```

ตอบคำถาม:
- Set up and deploy? **Y**
- Which scope? เลือก account ของคุณ
- Link to existing project? **N**
- What's your project's name? **versecanvas** (หรือชื่อที่ต้องการ)
- In which directory is your code located? **./** (กด Enter)
- Want to override the settings? **N**

#### ขั้นตอนที่ 4: ตั้งค่า Environment Variables
1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจค versecanvas
3. ไปที่ Settings > Environment Variables
4. เพิ่ม variables ต่อไปนี้:

```
VITE_FIREBASE_API_KEY=AIzaSyCifJfDFC_JZIVLdUMPhObVdhk-39lYj_k
VITE_FIREBASE_AUTH_DOMAIN=versecanvas-a9b76.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=versecanvas-a9b76
VITE_FIREBASE_STORAGE_BUCKET=versecanvas-a9b76.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=40464293145
VITE_FIREBASE_APP_ID=1:40464293145:web:e908fdd0f2b0f6f051b988
VITE_FIREBASE_DATABASE_URL=https://versecanvas-a9b76-default-rtdb.asia-southeast1.firebasedatabase.app/
VITE_CLOUDINARY_CLOUD_NAME=ds5t11i5v
VITE_CLOUDINARY_UPLOAD_PRESET=CommissionArt
```

#### ขั้นตอนที่ 5: Deploy Production
```bash
vercel --prod
```

✅ **เสร็จแล้ว!** เว็บจะอยู่ที่ `https://versecanvas.vercel.app` (หรือ URL ที่ Vercel สร้างให้)

---

### Option 2: Netlify

#### ขั้นตอนที่ 1: ติดตั้ง Netlify CLI
```bash
npm install -g netlify-cli
```

#### ขั้นตอนที่ 2: Login เข้า Netlify
```bash
netlify login
```

#### ขั้นตอนที่ 3: Build โปรเจค
```bash
cd /home/ubuntu/versecanvas-final
npm run build
```

#### ขั้นตอนที่ 4: Deploy
```bash
netlify deploy
```

ตอบคำถาม:
- Create & configure a new site? **Y**
- Team: เลือก team ของคุณ
- Site name: **versecanvas** (หรือชื่อที่ต้องการ)
- Publish directory: **dist**

#### ขั้นตอนที่ 5: ตั้งค่า Environment Variables
1. ไปที่ [Netlify Dashboard](https://app.netlify.com/)
2. เลือกโปรเจค versecanvas
3. ไปที่ Site settings > Environment variables
4. เพิ่ม variables เหมือนกับ Vercel

#### ขั้นตอนที่ 6: Deploy Production
```bash
netlify deploy --prod
```

✅ **เสร็จแล้ว!** เว็บจะอยู่ที่ `https://versecanvas.netlify.app`

---

### Option 3: Firebase Hosting

#### ขั้นตอนที่ 1: ติดตั้ง Firebase CLI
```bash
npm install -g firebase-tools
```

#### ขั้นตอนที่ 2: Login เข้า Firebase
```bash
firebase login
```

#### ขั้นตอนที่ 3: Initialize Firebase Hosting
```bash
cd /home/ubuntu/versecanvas-final
firebase init hosting
```

ตอบคำถาม:
- Select a default Firebase project: เลือก **versecanvas-a9b76**
- What do you want to use as your public directory? **dist**
- Configure as a single-page app? **Y**
- Set up automatic builds and deploys with GitHub? **N**
- File dist/index.html already exists. Overwrite? **N**

#### ขั้นตอนที่ 4: Build และ Deploy
```bash
npm run build
firebase deploy --only hosting
```

✅ **เสร็จแล้ว!** เว็บจะอยู่ที่ `https://versecanvas-a9b76.web.app`

---

## 🔧 การตั้งค่าเพิ่มเติม

### 1. Custom Domain (ถ้าต้องการ)

#### Vercel
1. ไปที่ Project Settings > Domains
2. Add Domain
3. ใส่ domain ของคุณ (เช่น versecanvas.com)
4. ตั้งค่า DNS ตามที่ Vercel แนะนำ

#### Netlify
1. ไปที่ Site settings > Domain management
2. Add custom domain
3. ตั้งค่า DNS ตามที่ Netlify แนะนำ

#### Firebase Hosting
1. ไปที่ Firebase Console > Hosting
2. Add custom domain
3. ตั้งค่า DNS ตามที่ Firebase แนะนำ

---

### 2. Firebase Security Rules

#### Firestore Rules
ไปที่ Firebase Console > Firestore Database > Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stories
    match /stories/{storyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.authorId == request.auth.uid;
    }
    
    // Artworks
    match /artworks/{artworkId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.authorId == request.auth.uid || 
         resource.data.artistId == request.auth.uid);
    }
    
    // Products
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.sellerId == request.auth.uid;
    }
    
    // Jobs
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         resource.data.artistId == request.auth.uid);
    }
    
    // Bookmarks
    match /bookmarks/{bookmarkId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create, delete: if request.auth != null;
    }
    
    // Transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Orders
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.sellerId == request.auth.uid);
      allow create: if request.auth != null;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Allow read/write for other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Realtime Database Rules
ไปที่ Firebase Console > Realtime Database > Rules

```json
{
  "rules": {
    "messages": {
      "$conversationId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

#### Storage Rules
ไปที่ Firebase Console > Storage > Rules

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

---

## 📊 การตรวจสอบหลัง Deploy

### 1. ตรวจสอบการทำงาน
- ✅ เปิดเว็บได้
- ✅ Login/Signup ทำงาน
- ✅ อัปโหลดรูปภาพได้ (Cloudinary)
- ✅ สร้างนิยาย/ผลงาน/สินค้าได้
- ✅ ระบบ Search ทำงาน
- ✅ ระบบ Bookmark ทำงาน
- ✅ Dashboard แสดงข้อมูล
- ✅ Messages ทำงาน (Real-time)
- ✅ Notifications ทำงาน

### 2. ตรวจสอบ Console
กด F12 เปิด Developer Tools และตรวจสอบ:
- ไม่มี Error สีแดง
- Firebase เชื่อมต่อสำเร็จ
- Cloudinary อัปโหลดสำเร็จ

### 3. ตรวจสอบ Performance
- หน้าเว็บโหลดเร็ว (< 3 วินาที)
- รูปภาพโหลดได้
- ไม่มี lag เวลาใช้งาน

---

## 🐛 การแก้ปัญหาที่พบบ่อย

### ปัญหา: Build ไม่ผ่าน
**วิธีแก้:**
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ปัญหา: Firebase ไม่เชื่อมต่อ
**วิธีแก้:**
1. ตรวจสอบ Environment Variables ว่าถูกต้อง
2. ตรวจสอบ Firebase Console ว่า enable Authentication, Firestore, Realtime DB แล้ว
3. ตรวจสอบ Firebase Rules

### ปัญหา: Cloudinary อัปโหลดไม่ได้
**วิธีแก้:**
1. ตรวจสอบ Cloud Name และ Upload Preset
2. ตรวจสอบว่า Upload Preset เป็น **unsigned**
3. ตรวจสอบ CORS settings ใน Cloudinary

### ปัญหา: หน้าเว็บขึ้น 404
**วิธีแก้:**
- **Vercel/Netlify**: ตั้งค่า Rewrites สำหรับ SPA
- **Firebase**: ตอน init hosting เลือก "Configure as single-page app" เป็น Yes

---

## 📝 Checklist ก่อน Deploy

- [ ] Build ผ่าน (`npm run build`)
- [ ] ไฟล์ `.env` มีค่าครบถ้วน
- [ ] Firebase setup เรียบร้อย
- [ ] Cloudinary setup เรียบร้อย
- [ ] ทดสอบ Login/Signup
- [ ] ทดสอบอัปโหลดรูป
- [ ] ทดสอบสร้างเนื้อหา
- [ ] ไม่มี Error ใน Console

---

## 🎉 เสร็จสิ้น!

เมื่อ deploy เรียบร้อยแล้ว เว็บไซต์ของคุณจะพร้อมใช้งาน!

**URL ตัวอย่าง:**
- Vercel: `https://versecanvas.vercel.app`
- Netlify: `https://versecanvas.netlify.app`
- Firebase: `https://versecanvas-a9b76.web.app`

---

## 📞 ต้องการความช่วยเหลือ?

1. ตรวจสอบ `README.md`
2. ตรวจสอบ `UPDATE_SUMMARY.md`
3. ตรวจสอบ Console (F12)
4. ตรวจสอบ Firebase Console
5. ตรวจสอบ Cloudinary Dashboard

**ขอให้โชคดี! 🚀**
