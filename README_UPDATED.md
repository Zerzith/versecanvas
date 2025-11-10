# VerseCanvas - แพลตฟอร์มเรื่องราวและงานศิลปะ

## 🎨 ภาพรวมโปรเจค

VerseCanvas เป็นแพลตฟอร์มที่ผสมผสานการเขียนเรื่องราวและงานศิลปะเข้าด้วยกัน พร้อมระบบ Social Features ที่ครบครัน

### ✨ ฟีเจอร์หลัก

#### 1. ระบบ Authentication
- ✅ เข้าสู่ระบบด้วย Email/Password
- ✅ เข้าสู่ระบบด้วย Google
- ✅ สมัครสมาชิกใหม่
- ✅ แก้ไขปัญหา Navbar/Footer ซ้ำซ้อน

#### 2. ระบบ Social Features
- ✅ **ไลค์** - กดไลค์โพสต์และงานศิลปะ (Firebase Realtime Database)
- ✅ **คอมเมนต์** - แสดงความคิดเห็นแบบเรียลไทม์
- ✅ **ติดตาม** - ติดตามผู้ใช้คนอื่น
- ✅ นับจำนวน Followers/Following

#### 3. ระบบแชท (Messages)
- ✅ แชทแบบเรียลไทม์ด้วย Firebase Realtime Database
- ✅ แสดงสถานะออนไลน์/ออฟไลน์
- ✅ ค้นหาการสนทนา
- ✅ ส่งข้อความได้จริง

#### 4. ระบบอัปโหลดรูปภาพ
- ✅ เชื่อมต่อ Cloudinary สำเร็จ
- ✅ อัปโหลดงานศิลปะ
- ✅ จัดการรูปภาพโปรไฟล์

#### 5. หน้าต่างๆ ที่พร้อมใช้งาน
- ✅ หน้าแรก (Home)
- ✅ เรื่องราว (Stories)
- ✅ งานศิลปะ (Artworks) - พร้อม Social Actions
- ✅ Artseek (หางาน)
- ✅ สำรวจ (Explore)
- ✅ ร้านค้า (Shop)
- ✅ ข้อความ (Messages)
- ✅ โปรไฟล์ (Profile)
- ✅ ตั้งค่า (Settings)

## 🚀 การติดตั้งและรันโปรเจค

### ขั้นตอนที่ 1: ติดตั้ง Dependencies

```bash
cd versecanvas
npm install --legacy-peer-deps
```

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

ไฟล์ `.env` ได้ถูกตั้งค่าไว้แล้วด้วย:
- Firebase Configuration
- Cloudinary Configuration

### ขั้นตอนที่ 3: รันโปรเจค

#### Development Mode
```bash
npm run dev
```

เว็บไซต์จะรันที่ `http://localhost:5173`

#### Production Build
```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Firebase Realtime Database
- ✅ เชื่อมต่อแล้ว: `https://versecanvas-a9b76-default-rtdb.asia-southeast1.firebasedatabase.app/`
- ใช้สำหรับ: แชท, ไลค์, คอมเมนต์, ติดตาม

### Cloudinary
- ✅ Cloud Name: `ds5t11i5v`
- ✅ Upload Preset: `CommissionArt`
- ใช้สำหรับ: อัปโหลดรูปภาพงานศิลปะและโปรไฟล์

## 📁 โครงสร้างโปรเจค

```
versecanvas/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── SocialActions.jsx      # ปุ่มไลค์, คอมเมนต์, แชร์
│   │   ├── CommentSection.jsx     # ระบบคอมเมนต์
│   │   └── FollowButton.jsx       # ปุ่มติดตาม
│   ├── contexts/
│   │   ├── AuthContext.jsx        # จัดการ Authentication
│   │   └── SocialContext.jsx      # จัดการ Social Features
│   ├── lib/
│   │   ├── firebase.js            # Firebase + Realtime DB
│   │   └── cloudinary.js          # Cloudinary Integration
│   ├── pages/
│   │   ├── Home.jsx               # หน้าแรก (แก้ไข Navbar/Footer ซ้ำแล้ว)
│   │   ├── Artworks.jsx           # งานศิลปะ (มี Social Features)
│   │   ├── Messages.jsx           # แชทเรียลไทม์
│   │   ├── Shop.jsx               # ร้านค้า
│   │   └── ...
│   └── App.jsx                    # Main App (มี SocialProvider)
├── .env                           # Environment Variables
└── vite.config.js                 # Vite Configuration
```

## 🎯 ฟีเจอร์ที่พัฒนาเสร็จสมบูรณ์

### 1. ระบบ Social (SocialContext.jsx)
```javascript
// ไลค์โพสต์
await likePost(postId, 'artwork')
await isLiked(postId, 'artwork')
await getLikeCount(postId, 'artwork')

// คอมเมนต์
await addComment(postId, 'artwork', 'ความคิดเห็น')
await getComments(postId, 'artwork')
await deleteComment(postId, 'artwork', commentId)

// ติดตาม
await followUser(userId)
await isFollowing(userId)
await getFollowerCount(userId)
await getFollowingCount(userId)
```

### 2. ระบบแชท (Messages.jsx)
- ใช้ Firebase Realtime Database
- อัปเดตแบบเรียลไทม์
- แสดงสถานะออนไลน์
- ค้นหาการสนทนา

### 3. ระบบอัปโหลดรูป (cloudinary.js)
```javascript
import { uploadImage } from '@/lib/cloudinary'

const result = await uploadImage(file, {
  folder: 'versecanvas/artworks',
  tags: ['artwork']
})
// result.url - URL ของรูปที่อัปโหลด
```

## 🎨 UI/UX Design

### สีหลัก
- พื้นหลัง: `#0f0f0f` (ดำเข้ม)
- Card: `#1a1a1a`
- Border: `#2a2a2a`
- Gradient: Pink → Purple → Teal

### Components
- ปุ่มทั้งหมดใช้ gradient สีชมพู-ม่วง
- Card มี hover effect
- Animation และ transition ที่ลื่นไหล

## 📝 การใช้งาน

### 1. สมัครสมาชิก/เข้าสู่ระบบ
- คลิกปุ่ม "สมัครสมาชิก" หรือ "เข้าสู่ระบบ" ที่ Navbar
- เลือกวิธีการเข้าสู่ระบบ (Email หรือ Google)

### 2. อัปโหลดงานศิลปะ
- เข้าหน้า "งานศิลปะ"
- คลิก "อัปโหลดงานศิลปะ"
- เลือกรูปภาพและกรอกรายละเอียด
- รูปจะถูกอัปโหลดไปยัง Cloudinary

### 3. ใช้งาน Social Features
- **ไลค์**: คลิกปุ่มหัวใจในงานศิลปะ
- **คอมเมนต์**: คลิก "แสดงความคิดเห็น" และพิมพ์ข้อความ
- **ติดตาม**: คลิกปุ่ม "ติดตาม" ในโปรไฟล์ผู้ใช้

### 4. แชท
- เข้าหน้า "ข้อความ"
- เลือกการสนทนาหรือเริ่มการสนทนาใหม่
- พิมพ์ข้อความและกด Enter หรือคลิกปุ่มส่ง

## 🐛 การแก้ปัญหาที่พบ

### ปัญหา: Navbar/Footer ซ้ำซ้อน
✅ **แก้ไขแล้ว** - ลบ Navbar และ Footer ออกจาก Home.jsx เนื่องจาก App.jsx มีอยู่แล้ว

### ปัญหา: ระบบ Social ไม่ทำงาน
✅ **แก้ไขแล้ว** - สร้าง SocialContext และเชื่อมต่อ Firebase Realtime Database

### ปัญหา: แชทไม่อัปเดตเรียลไทม์
✅ **แก้ไขแล้ว** - ใช้ `onValue` จาก Firebase Realtime Database

### ปัญหา: อัปโหลดรูปไม่ได้
✅ **แก้ไขแล้ว** - Cloudinary ได้ถูกตั้งค่าและทดสอบแล้ว

## 📦 Dependencies หลัก

```json
{
  "firebase": "^11.0.2",
  "react": "^18.3.1",
  "react-router-dom": "^7.0.1",
  "lucide-react": "^0.469.0",
  "axios": "^1.7.9"
}
```

## 🔐 Security Notes

1. **Firebase Rules**: ควรตั้งค่า Security Rules ใน Firebase Console
2. **Cloudinary**: Upload Preset ควรมีการจำกัดขนาดไฟล์และประเภทไฟล์
3. **Environment Variables**: ไม่ควร commit `.env` ลง Git

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ Console ใน Browser DevTools
2. ตรวจสอบ Firebase Console สำหรับ Database และ Authentication
3. ตรวจสอบ Cloudinary Dashboard สำหรับรูปภาพที่อัปโหลด

## 🎓 สำหรับโปรเจคจบ

โปรเจคนี้พร้อมใช้งานสำหรับการนำเสนอโปรเจคจบ ครอบคลุม:
- ✅ Frontend (React + Vite)
- ✅ Backend (Firebase)
- ✅ Database (Firestore + Realtime Database)
- ✅ Storage (Cloudinary)
- ✅ Authentication
- ✅ Real-time Features
- ✅ Social Features
- ✅ Responsive Design

---

**สร้างโดย**: Manus AI Assistant
**วันที่**: November 8, 2025
**เวอร์ชัน**: 1.0.0 (พร้อมใช้งาน)
