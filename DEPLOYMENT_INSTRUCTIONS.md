# VerseCanvas - คู่มือการ Deploy และสรุปการแก้ไข

## สรุปการแก้ไขที่ทำ

### 1. Firebase Rules (firestore.rules)
- ✅ เพิ่ม rules สำหรับ admin ให้สามารถจัดการข้อมูลได้
- ✅ เพิ่ม rules สำหรับ workSubmissions collection
- ✅ เพิ่ม rules สำหรับ payments collection
- ✅ ปรับปรุง security rules ให้ครอบคลุมทุก collection

### 2. Storage Rules (storage.rules)
- ✅ เพิ่ม rules สำหรับ artworks, products, stories
- ✅ กำหนดขนาดไฟล์สูงสุด 10MB
- ✅ จำกัดประเภทไฟล์ที่อนุญาต (image/*)

### 3. ระบบแสดงรูปภาพ Cloudinary (OrderHistory.jsx)
- ✅ แสดงรูปภาพจาก Cloudinary ในประวัติคำสั่งซื้อ
- ✅ รองรับการดูรูปขนาดเต็ม
- ✅ แสดง placeholder เมื่อโหลดรูปไม่สำเร็จ

### 4. ระบบดาวน์โหลดรูปภาพ
- ✅ สร้าง API `/api/download-image` สำหรับ proxy download
- ✅ แก้ปัญหา CORS เมื่อดาวน์โหลดจาก Cloudinary
- ✅ รองรับการดาวน์โหลดจาก Firebase Storage

### 5. ระบบส่งงาน ยืนยัน และยกเลิก (ClientJobReview.jsx, ArtistJobManagement.jsx)
- ✅ ระบบยืนยันงานพร้อมปลดล็อคเงินให้ศิลปิน
- ✅ ระบบยกเลิกงานพร้อมคืนเงินให้ลูกค้า
- ✅ ระบบขอแก้ไขงานพร้อมหมายเหตุ
- ✅ แสดงรูปภาพพร้อมลายน้ำก่อนยืนยัน
- ✅ ส่งรูปต้นฉบับหลังยืนยัน

### 6. ระบบเติมเงินและซื้อขาย
- ✅ ระบบเติมเงินผ่าน Stripe ทำงานได้จริง
- ✅ Webhook รับ event จาก Stripe และอัปเดตเครดิต
- ✅ ระบบซื้อขายสินค้าหักเครดิตและโอนให้ผู้ขาย
- ✅ บันทึกประวัติธุรกรรมทั้งหมด

### 7. เตรียมสำหรับ Vercel
- ✅ อัปเดต vercel.json ให้รองรับ API routes
- ✅ เพิ่ม CORS headers สำหรับ API
- ✅ อัปเดต .gitignore

---

## ขั้นตอนการ Deploy ขึ้น Vercel

### Step 1: Push ขึ้น GitHub

```bash
# เข้าไปในโฟลเดอร์โปรเจค
cd versecanvas-final

# Initialize git (ถ้ายังไม่มี)
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Initial commit - VerseCanvas complete"

# เพิ่ม remote repository
git remote add origin https://github.com/YOUR_USERNAME/versecanvas.git

# Push ขึ้น GitHub
git push -u origin main
```

### Step 2: Deploy บน Vercel

1. ไปที่ [vercel.com](https://vercel.com) และ login
2. คลิก "New Project"
3. Import repository จาก GitHub
4. เลือก repository ที่เพิ่ง push

### Step 3: ตั้งค่า Environment Variables บน Vercel

ไปที่ **Settings > Environment Variables** และเพิ่มค่าต่อไปนี้:

#### Client-side Variables (เริ่มต้นด้วย VITE_)
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
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

#### Server-side Variables (สำหรับ API functions)
```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
FIREBASE_PROJECT_ID=versecanvas-a9b76
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@versecanvas-a9b76.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Step 4: ตั้งค่า Stripe Webhook

1. ไปที่ [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. คลิก "Add endpoint"
3. ใส่ URL: `https://your-domain.vercel.app/api/webhook`
4. เลือก events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. คัดลอก Webhook Signing Secret ไปใส่ใน Vercel Environment Variables

### Step 5: Deploy Firebase Rules

```bash
# Login Firebase
firebase login

# Deploy Firestore Rules
firebase deploy --only firestore:rules

# Deploy Storage Rules
firebase deploy --only storage

# Deploy Realtime Database Rules
firebase deploy --only database
```

---

## การทดสอบ

### ทดสอบการเติมเงิน
1. ไปที่หน้า `/credits`
2. เลือกแพ็คเกจ
3. ใช้บัตรทดสอบ: `4242 4242 4242 4242`
4. วันหมดอายุ: เดือน/ปีในอนาคต (เช่น 12/25)
5. CVC: 123

### ทดสอบการซื้อสินค้า
1. ไปที่หน้า `/shop`
2. เลือกสินค้าและกดซื้อ
3. ตรวจสอบประวัติที่ `/orders`

### ทดสอบ Commission
1. สร้างงานที่ `/create-job`
2. ศิลปินรับงานและส่งงานที่ `/artist-jobs`
3. ลูกค้าตรวจสอบและยืนยันที่ `/job/:id/review`

---

## โครงสร้างไฟล์สำคัญ

```
versecanvas-final/
├── api/                          # Vercel Serverless Functions
│   ├── create-payment-intent.js  # สร้าง Stripe PaymentIntent
│   ├── webhook.js                # รับ Stripe Webhooks
│   └── download-image.js         # Proxy ดาวน์โหลดรูปภาพ
├── src/
│   ├── contexts/
│   │   ├── CreditContext.jsx     # จัดการเครดิต
│   │   └── EscrowContext.jsx     # จัดการ Escrow
│   ├── pages/
│   │   ├── Credits.jsx           # หน้าเติมเงิน
│   │   ├── Shop.jsx              # หน้าร้านค้า
│   │   ├── OrderHistory.jsx      # ประวัติคำสั่งซื้อ
│   │   ├── ClientJobReview.jsx   # ตรวจสอบงาน Commission
│   │   └── ArtistJobManagement.jsx # จัดการงานศิลปิน
│   └── lib/
│       ├── firebase.js           # Firebase config
│       ├── cloudinary.js         # Cloudinary upload
│       └── watermark.js          # เพิ่มลายน้ำ
├── firestore.rules               # Firestore Security Rules
├── storage.rules                 # Storage Security Rules
├── vercel.json                   # Vercel config
└── .env.example                  # ตัวอย่าง environment variables
```

---

## หมายเหตุสำคัญ

1. **อย่าลืมเปลี่ยน Stripe keys เป็น Production keys** เมื่อพร้อมใช้งานจริง
2. **ตรวจสอบ Firebase Rules** ให้แน่ใจว่า deploy แล้ว
3. **ทดสอบ Webhook** ให้แน่ใจว่าทำงานได้ก่อน production
4. **Backup ข้อมูล** ก่อนทำการเปลี่ยนแปลงใดๆ

---

## Support

หากพบปัญหา กรุณาติดต่อ:
- Email: admin@versecanvas.com
- GitHub Issues: สร้าง issue ใน repository
