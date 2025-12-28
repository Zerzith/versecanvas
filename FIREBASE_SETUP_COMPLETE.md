# 🔥 คู่มือตั้งค่า Firebase สำหรับ VerseCanvas

## 📋 ขั้นตอนที่ 1: สร้างโปรเจค Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก "Add project" หรือเลือกโปรเจค `versecanvas-a9b76` ที่มีอยู่แล้ว
3. เปิดใช้งาน Google Analytics (ถ้าต้องการ)

---

## 📋 ขั้นตอนที่ 2: เปิดใช้งาน Authentication

1. ไปที่ **Authentication** > **Get started**
2. เปิดใช้งาน **Sign-in methods** ต่อไปนี้:
   - ✅ **Email/Password** - เปิดใช้งาน
   - ✅ **Google** - เปิดใช้งาน (ใส่ Support email)

---

## 📋 ขั้นตอนที่ 3: สร้าง Firestore Database

1. ไปที่ **Firestore Database** > **Create database**
2. เลือก **Start in production mode**
3. เลือก Location: `asia-southeast1` (Singapore)
4. คลิก **Enable**

### ตั้งค่า Firestore Rules

1. ไปที่ **Firestore Database** > **Rules**
2. คัดลอกโค้ดจากไฟล์ `firestore.rules` ในโปรเจค
3. วางแทนที่ rules เดิม
4. คลิก **Publish**

### สร้าง Firestore Indexes (สำคัญมาก!)

ไปที่ **Firestore Database** > **Indexes** > **Composite** และสร้าง indexes ต่อไปนี้:

#### 1. Notifications Index
- Collection: `notifications`
- Fields:
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

**หรือคลิกลิงก์นี้เพื่อสร้างอัตโนมัติ:**
```
https://console.firebase.google.com/v1/r/project/versecanvas-a9b76/firestore/indexes?create_composite=Cldwcm9qZWN0cy92ZXJzZWNhbnZhcy1hOWI3Ni9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
```

#### 2. Stories Index
- Collection: `stories`
- Fields:
  - `authorId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

#### 3. Products Index
- Collection: `products`
- Fields:
  - `sellerId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

#### 4. Orders Index
- Collection: `orders`
- Fields:
  - `buyerId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

#### 5. Transactions Index
- Collection: `transactions`
- Fields:
  - `fromUserId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

---

## 📋 ขั้นตอนที่ 4: สร้าง Realtime Database

1. ไปที่ **Realtime Database** > **Create Database**
2. เลือก Location: `asia-southeast1`
3. เลือก **Start in locked mode**
4. คลิก **Enable**

### ตั้งค่า Realtime Database Rules

1. ไปที่ **Realtime Database** > **Rules**
2. คัดลอกโค้ดจากไฟล์ `database.rules.json` ในโปรเจค
3. วางแทนที่ rules เดิม
4. คลิก **Publish**

---

## 📋 ขั้นตอนที่ 5: เปิดใช้งาน Storage (ถ้าต้องการ)

1. ไปที่ **Storage** > **Get started**
2. เลือก **Start in production mode**
3. เลือก Location: `asia-southeast1`
4. คลิก **Done**

### ตั้งค่า Storage Rules (ถ้าใช้)

```
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

## 📋 ขั้นตอนที่ 6: ตรวจสอบการตั้งค่า

### ตรวจสอบ Firebase Config

ไฟล์ `.env` ควรมีค่าต่อไปนี้:

```env
VITE_FIREBASE_API_KEY=AIzaSyCifJfDFC_JZIVLdUMPhObVdhk-39lYj_k
VITE_FIREBASE_AUTH_DOMAIN=versecanvas-a9b76.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=versecanvas-a9b76
VITE_FIREBASE_STORAGE_BUCKET=versecanvas-a9b76.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=40464293145
VITE_FIREBASE_APP_ID=1:40464293145:web:e908fdd0f2b0f6f051b988
VITE_FIREBASE_DATABASE_URL=https://versecanvas-a9b76-default-rtdb.asia-southeast1.firebasedatabase.app

VITE_CLOUDINARY_CLOUD_NAME=ds5t11i5v
VITE_CLOUDINARY_UPLOAD_PRESET=CommissionArt
```

---

## 📋 ขั้นตอนที่ 7: ทดสอบระบบ

### 1. ทดสอบ Authentication
- ลงทะเบียนผู้ใช้ใหม่
- เข้าสู่ระบบด้วย Email/Password
- เข้าสู่ระบบด้วย Google

### 2. ทดสอบ Firestore
- สร้างนิยาย
- สร้างผลงานศิลปะ
- เพิ่มสินค้าในร้านค้า
- ซื้อสินค้า
- ตรวจสอบคำสั่งซื้อ
- ตรวจสอบประวัติธุรกรรม

### 3. ทดสอบ Realtime Database
- ส่งข้อความ
- ดูยอดรับชม
- กดไลค์

### 4. ทดสอบ Cloudinary
- อัปโหลดรูปโปรไฟล์
- อัปโหลดปกนิยาย
- อัปโหลดผลงานศิลปะ
- อัปโหลดสินค้า

---

## 🚨 แก้ไขปัญหาที่พบบ่อย

### ปัญหา: "Missing or insufficient permissions"
**วิธีแก้:**
1. ตรวจสอบ Firestore Rules ว่าตั้งค่าถูกต้อง
2. ตรวจสอบว่าผู้ใช้ล็อกอินแล้ว
3. ตรวจสอบว่า userId ตรงกับ currentUser.uid

### ปัญหา: "The query requires an index"
**วิธีแก้:**
1. คลิกลิงก์ใน error message
2. หรือสร้าง index ตามขั้นตอนที่ 3

### ปัญหา: รูปไม่แสดง
**วิธีแก้:**
1. ตรวจสอบ Cloudinary config ใน `.env`
2. ตรวจสอบว่า Upload Preset เป็น "unsigned"
3. ตรวจสอบ CORS settings ใน Cloudinary

### ปัญหา: ข้อความไม่ส่ง
**วิธีแก้:**
1. ตรวจสอบ Realtime Database Rules
2. ตรวจสอบ Database URL ใน `.env`

---

## ✅ Checklist การตั้งค่า

- [ ] สร้างโปรเจค Firebase
- [ ] เปิดใช้งาน Email/Password Authentication
- [ ] เปิดใช้งาน Google Authentication
- [ ] สร้าง Firestore Database
- [ ] ตั้งค่า Firestore Rules
- [ ] สร้าง Firestore Indexes (ทั้ง 5 indexes)
- [ ] สร้าง Realtime Database
- [ ] ตั้งค่า Realtime Database Rules
- [ ] ตรวจสอบ `.env` file
- [ ] ทดสอบ Authentication
- [ ] ทดสอบ Firestore
- [ ] ทดสอบ Realtime Database
- [ ] ทดสอบ Cloudinary

---

## 🎯 เสร็จสิ้น!

หลังจากทำตามขั้นตอนทั้งหมดแล้ว ระบบจะพร้อมใช้งาน 100%!

หากมีปัญหาหรือข้อสงสัย ตรวจสอบ Console ใน Browser (F12) เพื่อดู error messages
