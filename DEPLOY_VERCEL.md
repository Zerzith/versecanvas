# 🚀 Deploy VerseCanvas ไป Vercel

## ขั้นตอนการ Deploy

### 1. เตรียม GitHub Repository

```bash
# สร้าง Git repository (ถ้ายังไม่มี)
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Initial commit - Ready for Vercel deployment"

# เชื่อมต่อกับ GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push ขึ้น GitHub
git push -u origin main
```

**⚠️ สำคัญ:** ไฟล์ `.env` จะไม่ถูก push ขึ้น GitHub เพราะอยู่ใน `.gitignore` แล้ว

---

### 2. สร้างโปรเจคใน Vercel

#### วิธีที่ 1: ผ่าน Vercel Dashboard (แนะนำ)

1. ไปที่ [vercel.com](https://vercel.com)
2. คลิก **"Sign Up"** หรือ **"Log In"** ด้วย GitHub
3. คลิก **"Add New Project"**
4. เลือก Repository ที่เพิ่งสร้าง
5. คลิก **"Import"**

#### วิธีที่ 2: ผ่าน Vercel CLI

```bash
# ติดตั้ง Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

---

### 3. ตั้งค่า Environment Variables ใน Vercel

**สำคัญมาก!** ต้องตั้งค่า Environment Variables ใน Vercel Dashboard:

1. ไปที่ **Project Settings** > **Environment Variables**
2. เพิ่มตัวแปรทั้งหมดจากไฟล์ `.env`:

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

3. เลือก **Environment:** `Production`, `Preview`, และ `Development`
4. คลิก **"Save"**

---

### 4. Redeploy

หลังจากตั้งค่า Environment Variables แล้ว:

1. ไปที่ **Deployments** tab
2. คลิก **"Redeploy"** บน deployment ล่าสุด
3. รอสักครู่จนกว่า deployment จะเสร็จ

---

### 5. ตั้งค่า Firebase Authorized Domains

เพิ่ม Vercel domain ใน Firebase Console:

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจค **versecanvas-a9b76**
3. ไปที่ **Authentication** > **Settings** > **Authorized domains**
4. คลิก **"Add domain"**
5. เพิ่ม domain ของ Vercel (เช่น `your-app.vercel.app`)
6. คลิก **"Add"**

---

## ✅ เสร็จสิ้น!

เว็บไซต์ของคุณจะพร้อมใช้งานที่:
- **Production:** `https://your-app.vercel.app`
- **Custom Domain:** สามารถตั้งค่าได้ใน Vercel Dashboard

---

## 🔄 อัปเดตเว็บไซต์

ทุกครั้งที่ push โค้ดใหม่ขึ้น GitHub:

```bash
git add .
git commit -m "Update: your message"
git push
```

Vercel จะ **auto-deploy** ให้อัตโนมัติ!

---

## 🐛 Troubleshooting

### ปัญหา: Firebase ไม่ทำงาน
- ตรวจสอบว่าตั้งค่า Environment Variables ครบถ้วน
- ตรวจสอบว่าเพิ่ม Vercel domain ใน Firebase Authorized domains แล้ว

### ปัญหา: หน้าเว็บแสดง 404
- ตรวจสอบว่ามีไฟล์ `vercel.json` และ config ถูกต้อง
- Redeploy อีกครั้ง

### ปัญหา: Build ล้มเหลว
- ตรวจสอบ build logs ใน Vercel Dashboard
- ตรวจสอบว่า `npm run build` ทำงานได้ใน local

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**หมายเหตุ:** ใช้ Vercel Free Plan ได้เลย! รองรับ:
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ 100GB bandwidth/month
