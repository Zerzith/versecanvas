# คู่มือการติดตั้งและใช้งาน VerseCanvas

## 📋 สารบัญ

1. [ข้อกำหนดเบื้องต้น](#ข้อกำหนดเบื้องต้น)
2. [การติดตั้งโปรเจกต์](#การติดตั้งโปรเจกต์)
3. [การตั้งค่า Firebase](#การตั้งค่า-firebase)
4. [การตั้งค่า Cloudinary](#การตั้งค่า-cloudinary)
5. [การรันโปรเจกต์](#การรันโปรเจกต์)
6. [การใช้งานฟีเจอร์ต่างๆ](#การใช้งานฟีเจอร์ต่างๆ)
7. [การเข้าถึงระบบ Admin](#การเข้าถึงระบบ-admin)
8. [การแก้ไขปัญหาที่พบบ่อย](#การแก้ไขปัญหาที่พบบ่อย)

---

## ข้อกำหนดเบื้องต้น

ก่อนเริ่มติดตั้ง ตรวจสอบให้แน่ใจว่าคุณมีสิ่งต่อไปนี้:

- **Node.js** เวอร์ชัน 18 หรือใหม่กว่า ([ดาวน์โหลด](https://nodejs.org/))
- **pnpm** (แนะนำ) หรือ npm/yarn
  ```bash
  npm install -g pnpm
  ```
- **VSCode** หรือ text editor ที่คุณชอบ
- **บัญชี Firebase** (ฟรี) - [สมัครที่นี่](https://console.firebase.google.com/)
- **บัญชี Cloudinary** (ฟรี) - [สมัครที่นี่](https://cloudinary.com/)

---

## การติดตั้งโปรเจกต์

### 1. เปิดโปรเจกต์ใน VSCode

```bash
cd /path/to/versecanvas
code .
```

### 2. ติดตั้ง Dependencies

```bash
pnpm install
```

หรือถ้าใช้ npm:

```bash
npm install
```

---

## การตั้งค่า Firebase

### 1. สร้างโปรเจกต์ Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก **"Add project"** หรือ **"เพิ่มโปรเจกต์"**
3. ตั้งชื่อโปรเจกต์ เช่น `versecanvas`
4. ปิดการใช้งาน Google Analytics (ไม่จำเป็น)
5. คลิก **"Create project"**

### 2. เปิดใช้งาน Authentication

1. ในเมนูด้านซ้าย เลือก **"Build"** > **"Authentication"**
2. คลิก **"Get started"**
3. เปิดใช้งานผู้ให้บริการต่อไปนี้:

   **Email/Password:**
   - คลิกที่ **"Email/Password"**
   - เปิดใช้งาน **"Email/Password"**
   - คลิก **"Save"**

   **Google:**
   - คลิกที่ **"Google"**
   - เปิดใช้งาน
   - เลือกอีเมลสำหรับ support
   - คลิก **"Save"**

   **Anonymous:**
   - คลิกที่ **"Anonymous"**
   - เปิดใช้งาน
   - คลิก **"Save"**

### 3. สร้าง Firestore Database

1. ในเมนูด้านซ้าย เลือก **"Build"** > **"Firestore Database"**
2. คลิก **"Create database"**
3. เลือก **"Start in test mode"** (สำหรับการพัฒนา)
4. เลือก location ที่ใกล้ที่สุด เช่น `asia-southeast1`
5. คลิก **"Enable"**

### 4. รับค่า Configuration

1. ไปที่ **Project Settings** (ไอคอนเฟือง)
2. เลื่อนลงมาที่ **"Your apps"**
3. คลิก **"Web"** (ไอคอน `</>`)
4. ตั้งชื่อแอป เช่น `VerseCanvas Web`
5. คลิก **"Register app"**
6. คัดลอกค่า `firebaseConfig`

### 5. ใส่ค่า Configuration ในโปรเจกต์

เปิดไฟล์ `src/lib/firebase.js` และแทนที่ค่าต่อไปนี้:

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

---

## การตั้งค่า Cloudinary

### 1. สร้างบัญชี Cloudinary

1. ไปที่ [Cloudinary](https://cloudinary.com/)
2. คลิก **"Sign Up for Free"**
3. กรอกข้อมูลและยืนยันอีเมล

### 2. รับค่า Cloud Name

1. เข้าสู่ระบบ Cloudinary Dashboard
2. ที่มุมบนซ้าย คุณจะเห็น **"Cloud Name"** ของคุณ
3. จดค่านี้ไว้

### 3. สร้าง Upload Preset

1. ไปที่ **Settings** (ไอคอนเฟือง)
2. เลือกแท็บ **"Upload"**
3. เลื่อนลงมาที่ **"Upload presets"**
4. คลิก **"Add upload preset"**
5. ตั้งค่าดังนี้:
   - **Preset name**: `versecanvas_unsigned`
   - **Signing Mode**: **Unsigned**
   - **Folder**: `versecanvas` (ไม่บังคับ)
6. คลิก **"Save"**

### 4. ใส่ค่า Configuration ในโปรเจกต์

เปิดไฟล์ `src/lib/cloudinary.js` และแทนที่ค่าต่อไปนี้:

```javascript
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = 'versecanvas_unsigned';
```

---

## การรันโปรเจกต์

### รันในโหมด Development

```bash
pnpm run dev
```

เว็บไซต์จะเปิดที่ `http://localhost:5173`

### Build สำหรับ Production

```bash
pnpm run build
```

ไฟล์ที่ build แล้วจะอยู่ในโฟลเดอร์ `dist/`

### Preview Build

```bash
pnpm run preview
```

---

## การใช้งานฟีเจอร์ต่างๆ

### 1. การสมัครสมาชิก

1. คลิก **"สมัครสมาชิก"** หรือ **"Sign Up"** ที่มุมขวาบน
2. เลือกวิธีการสมัคร:
   - **อีเมล**: กรอกชื่อ, อีเมล, รหัสผ่าน
   - **Google**: คลิกปุ่ม Google และเลือกบัญชี
   - **Anonymous**: คลิก "Continue as Guest"

### 2. การเขียนเรื่องราว

1. เข้าสู่ระบบ
2. ไปที่หน้า **"Stories"** หรือ **"เรื่องราว"**
3. คลิก **"Create Story"** หรือ **"สร้างเรื่องราว"**
4. กรอกข้อมูล:
   - **ชื่อเรื่อง**: ชื่อของเรื่องราว
   - **คำอธิบาย**: คำอธิบายสั้นๆ
   - **หมวดหมู่**: เลือกหมวดหมู่
   - **แท็ก**: เพิ่มแท็ก (คั่นด้วยจุลภาค)
   - **ภาพปก**: อัปโหลดภาพปก (ไม่บังคับ)
   - **เนื้อหา**: เขียนเรื่องราวด้วย Rich Text Editor
5. คลิก **"Publish Story"** หรือ **"เผยแพร่เรื่องราว"**

### 3. การอัปโหลดงานศิลปะ

1. เข้าสู่ระบบ
2. ไปที่หน้า **"Artworks"** หรือ **"งานศิลปะ"**
3. คลิก **"Upload Artwork"** หรือ **"อัปโหลดงานศิลปะ"**
4. กรอกข้อมูล:
   - **รูปภาพ**: เลือกรูปภาพงานศิลปะ (บังคับ)
   - **ชื่อผลงาน**: ชื่อของงานศิลปะ
   - **คำอธิบาย**: คำอธิบายเกี่ยวกับผลงาน
   - **หมวดหมู่**: เลือกหมวดหมู่
   - **แท็ก**: เพิ่มแท็ก (ไม่บังคับ)
5. คลิก **"Publish Artwork"** หรือ **"เผยแพร่ผลงาน"**

### 4. การเปลี่ยนภาษา

- คลิกที่ปุ่ม **"TH"** หรือ **"EN"** ที่มุมขวาบนของ Navbar
- เว็บไซต์จะเปลี่ยนภาษาทันที

---

## การเข้าถึงระบบ Admin

### วิธีที่ 1: ผ่าน Firebase Console (แนะนำ)

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ **Firestore Database**
4. เปิด collection **"users"**
5. หา document ของผู้ใช้ที่คุณต้องการให้เป็น admin
6. แก้ไขฟิลด์ `role` จาก `"user"` เป็น `"admin"`
7. บันทึกการเปลี่ยนแปลง
8. Refresh หน้าเว็บและไปที่ `/admin`

### วิธีที่ 2: สร้าง Admin User ตั้งแต่แรก

ถ้าคุณต้องการให้ผู้ใช้แรกเป็น admin อัตโนมัติ:

1. เปิดไฟล์ `src/contexts/AuthContext.jsx`
2. ในฟังก์ชัน `signup`, เพิ่มโค้ดนี้:

```javascript
await setDoc(doc(db, 'users', userCredential.user.uid), {
  uid: userCredential.user.uid,
  email,
  displayName,
  role: 'admin', // เปลี่ยนจาก 'user' เป็น 'admin'
  createdAt: serverTimestamp()
});
```

---

## การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: Firebase Authentication ไม่ทำงาน

**วิธีแก้:**
- ตรวจสอบว่าคุณได้เปิดใช้งาน Authentication providers ใน Firebase Console แล้ว
- ตรวจสอบว่าค่า `firebaseConfig` ถูกต้อง
- ลองล้าง cache ของเบราว์เซอร์

### ปัญหา: อัปโหลดรูปภาพไม่ได้

**วิธีแก้:**
- ตรวจสอบว่า Upload Preset ใน Cloudinary เป็น **Unsigned**
- ตรวจสอบว่าค่า `CLOUDINARY_CLOUD_NAME` และ `CLOUDINARY_UPLOAD_PRESET` ถูกต้อง
- ตรวจสอบขนาดไฟล์ (ต้องไม่เกิน 10MB)

### ปัญหา: หน้า Admin ไม่แสดง

**วิธีแก้:**
- ตรวจสอบว่าผู้ใช้มี `role: "admin"` ใน Firestore
- ลอง logout และ login ใหม่
- ตรวจสอบ Console ของเบราว์เซอร์หา error

### ปัญหา: Dependencies ติดตั้งไม่ได้

**วิธีแก้:**
```bash
# ลบ node_modules และ lock file
rm -rf node_modules pnpm-lock.yaml

# ติดตั้งใหม่
pnpm install
```

---

## 📞 การติดต่อและสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:

- ตรวจสอบ Console ของเบราว์เซอร์ (F12) เพื่อดู error messages
- อ่าน documentation ของ [Firebase](https://firebase.google.com/docs) และ [Cloudinary](https://cloudinary.com/documentation)
- ตรวจสอบว่าทุก configuration ถูกต้อง

---

**สร้างโดย Manus AI**

*เอกสารนี้อัปเดตล่าสุด: ตุลาคม 2025*

