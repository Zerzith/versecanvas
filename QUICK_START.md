# 🚀 Quick Start Guide - VerseCanvas

## เริ่มต้นใช้งานใน 5 นาที

### 1. เปิดโปรเจกต์ใน VSCode

```bash
cd /home/ubuntu/versecanvas
code .
```

### 2. ติดตั้ง Dependencies

```bash
pnpm install
```

### 3. ตั้งค่า Firebase

1. ไปที่ https://console.firebase.google.com/
2. สร้างโปรเจกต์ใหม่
3. เปิดใช้งาน Authentication (Email/Password, Google, Anonymous)
4. สร้าง Firestore Database (test mode)
5. คัดลอก Firebase Config
6. แก้ไขไฟล์ `src/lib/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. ตั้งค่า Cloudinary

1. ไปที่ https://cloudinary.com/
2. สมัครบัญชีฟรี
3. ไปที่ Settings > Upload > Upload Presets
4. สร้าง preset ใหม่ (Unsigned mode)
5. แก้ไขไฟล์ `src/lib/cloudinary.js`:

```javascript
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';
```

### 5. รันโปรเจกต์

```bash
pnpm run dev
```

เปิดเบราว์เซอร์ที่ http://localhost:5173

---

## 🎯 ทดสอบฟีเจอร์

### ทดสอบ Authentication
1. คลิก "Sign Up" ที่มุมขวาบน
2. ลองสมัครด้วย Email หรือ Google
3. ลองเข้าสู่ระบบแบบ Anonymous

### ทดสอบ Stories
1. เข้าสู่ระบบ
2. ไปที่ "Stories"
3. คลิก "Create Story"
4. เขียนเรื่องราวและเผยแพร่

### ทดสอบ Artworks
1. เข้าสู่ระบบ
2. ไปที่ "Artworks"
3. คลิก "Upload Artwork"
4. อัปโหลดรูปภาพและเผยแพร่

### ทดสอบ Admin
1. ไปที่ Firebase Console > Firestore
2. เปิด collection "users"
3. แก้ไข role เป็น "admin"
4. ไปที่ /admin

---

## 📝 คำสั่งที่ใช้บ่อย

```bash
# รันโหมด development
pnpm run dev

# Build สำหรับ production
pnpm run build

# Preview build
pnpm run preview

# Lint code
pnpm run lint
```

---

## ⚡ Tips

- ใช้ **TH/EN** ปุ่มที่มุมขวาบนเพื่อสลับภาษา
- กด **F12** เพื่อเปิด Developer Console ดู errors
- ตรวจสอบ Firebase Console เพื่อดูข้อมูลใน Firestore
- ตรวจสอบ Cloudinary Dashboard เพื่อดูรูปภาพที่อัปโหลด

---

**สำเร็จ! 🎉**

คุณพร้อมใช้งาน VerseCanvas แล้ว!

