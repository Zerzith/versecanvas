# VerseCanvas - แพลตฟอร์มสร้างสรรค์และซื้อขายงานศิลปะ

VerseCanvas เป็นแพลตฟอร์มออนไลน์ที่รวมระบบสร้างสรรค์เนื้อหา การซื้อขายงานศิลปะ และระบบจัดการงานคอมมิชชั่นเข้าด้วยกัน พร้อมระบบเครดิตและการทำธุรกรรมที่ครบถ้วน

## ✨ ฟีเจอร์หลัก

### 🎨 ระบบสร้างสรรค์
- **นิยาย/เรื่องราว**: สร้าง แก้ไข และเผยแพร่นิยายของคุณ
- **ผลงานศิลปะ**: อัปโหลดและจัดการผลงานศิลปะ
- **สำรวจ**: ค้นพบผลงานใหม่ๆ จากศิลปินทั่วโลก

### 💰 ระบบเครดิตและการเงิน
- **เติมเครดิต**: เติมเครดิตเข้าบัญชีด้วย Stripe (บัตรเครดิต/เดบิต)
- **โอนเครดิต**: โอนเครดิตให้ผู้ใช้คนอื่น
- **ประวัติธุรกรรม**: ดูประวัติการทำธุรกรรมทั้งหมด
- **ระบบ Escrow**: ระบบค้ำประกันเงินสำหรับงานคอมมิชชั่น
- **Stripe Payment**: รองรับการชำระเงินจริงผ่าน Stripe

### 🛒 ระบบซื้อขาย
- **ร้านค้า**: ซื้อขายผลงานศิลปะและสินค้าดิจิทัล
- **เพิ่มสินค้า**: ผู้ใช้สามารถเพิ่มสินค้าขายได้
- **ประวัติการสั่งซื้อ**: ติดตามคำสั่งซื้อของคุณ
- **คำขอศิลปะ**: สร้างคำขอสำหรับงานศิลปะที่ต้องการ

### 💼 ระบบงานคอมมิชชั่น
- **Artseek**: ค้นหาศิลปินและสร้างงานคอมมิชชั่น
- **สร้างงาน**: สร้างโปรเจคงานศิลปะ
- **จัดการงาน**: จัดการงานทั้งในฝั่งลูกค้าและศิลปิน
- **รีวิวงาน**: ระบบรีวิวและตรวจสอบงาน

### 💬 ระบบสื่อสาร
- **ข้อความ**: แชทกับผู้ใช้คนอื่น
- **การแจ้งเตือน**: รับการแจ้งเตือนเมื่อมีกิจกรรมสำคัญ

### 👤 ระบบผู้ใช้
- **โปรไฟล์**: จัดการข้อมูลส่วนตัวและผลงาน
- **ตั้งค่า**: ปรับแต่งการใช้งาน
- **ระบบแอดมิน**: จัดการระบบโดยรวม

## 🚀 เทคโนโลยีที่ใช้

### Frontend
- **React 18.3.1**: JavaScript library สำหรับสร้าง UI
- **Vite**: Build tool ที่รวดเร็ว
- **React Router DOM 7.6.1**: การจัดการ routing
- **Tailwind CSS 4.1.7**: Utility-first CSS framework
- **Radix UI**: Component library สำหรับ accessible UI
- **Lucide React**: Icon library
- **Framer Motion**: Animation library

### Payment Gateway
- **Stripe**: ระบบชำระเงินที่ปลอดภัยและเชื่อถือได้
- **@stripe/stripe-js**: Stripe JavaScript SDK
- **@stripe/react-stripe-js**: Stripe React Components

### Backend & Database
- **Firebase Authentication**: ระบบยืนยันตัวตน
- **Cloud Firestore**: NoSQL database
- **Firebase Storage**: จัดเก็บไฟล์และรูปภาพ
- **Firebase Realtime Database**: Real-time data sync

### การจัดการรูปภาพ
- **Cloudinary**: จัดเก็บและจัดการรูปภาพ

### เครื่องมืออื่นๆ
- **React Hook Form**: จัดการ form
- **Zod**: Schema validation
- **Axios**: HTTP client
- **React Quill**: Rich text editor
- **Recharts**: Data visualization

## 📦 การติดตั้ง

### ข้อกำหนดเบื้องต้น
- Node.js 18+ 
- npm หรือ pnpm
- Firebase account
- Cloudinary account

### ขั้นตอนการติดตั้ง

1. **Clone repository**
```bash
git clone <repository-url>
cd versecanvas-final
```

2. **ติดตั้ง dependencies**
```bash
npm install
# หรือ
pnpm install
```

3. **ตั้งค่า environment variables**

สร้างไฟล์ `.env` ในโฟลเดอร์หลัก:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

4. **ตั้งค่า Firebase**

- สร้างโปรเจค Firebase ใหม่ที่ [Firebase Console](https://console.firebase.google.com/)
- เปิดใช้งาน Authentication (Email/Password)
- สร้าง Firestore Database
- สร้าง Storage
- สร้าง Realtime Database
- คัดลอก configuration มาใส่ในไฟล์ `.env`

5. **ตั้งค่า Cloudinary**

- สร้างบัญชีที่ [Cloudinary](https://cloudinary.com/)
- สร้าง Upload Preset (แนะนำให้ใช้ unsigned preset)
- คัดลอก Cloud Name และ Upload Preset มาใส่ในไฟล์ `.env`

6. **ตั้งค่า Stripe** (สำหรับการชำระเงินจริง)

- สมัครบัญชีที่ [Stripe Dashboard](https://dashboard.stripe.com/register)
- ดึง API Keys จาก [API Keys](https://dashboard.stripe.com/apikeys)
- คัดลอก Publishable Key และ Secret Key มาใส่ในไฟล์ `.env`
- **ดูคู่มือเพิ่มเติม**: อ่านไฟล์ `STRIPE_GUIDE.md` สำหรับคำแนะนำแบบละเอียด

7. **ตั้งค่า Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stories collection
    match /stories/{storyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.authorId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.sellerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Jobs collection
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         resource.data.artistId == request.auth.uid);
      allow delete: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.sellerId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.sellerId == request.auth.uid);
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Escrow collection
    match /escrow/{escrowId} {
      allow read: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         resource.data.artistId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         resource.data.artistId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

7. **ตั้งค่า Storage Security Rules**

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

## 🏃‍♂️ การรันโปรเจค

### Development Mode
```bash
npm run dev
# หรือ
pnpm dev
```

เว็บจะเปิดที่ `http://localhost:5173`

### Production Build
```bash
npm run build
# หรือ
pnpm build
```

### Preview Production Build
```bash
npm run preview
# หรือ
pnpm preview
```

## 📱 โครงสร้างโปรเจค

```
versecanvas-final/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # React components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── NotificationPanel.jsx
│   │   └── ...
│   ├── contexts/       # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── CreditContext.jsx
│   │   ├── EscrowContext.jsx
│   │   ├── NotificationContext.jsx
│   │   ├── SettingsContext.jsx
│   │   └── SocialContext.jsx
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Libraries and utilities
│   │   └── firebase.js
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Stories.jsx
│   │   ├── Shop.jsx
│   │   ├── Credits.jsx
│   │   ├── TransactionHistory.jsx
│   │   ├── OrderHistory.jsx
│   │   └── ...
│   ├── App.jsx         # Main app component
│   ├── App.css         # Global styles
│   └── main.jsx        # Entry point
├── .env                # Environment variables
├── .env.example        # Example environment variables
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── README.md           # This file
```

## 🌐 การ Deploy

### Vercel (แนะนำ)

1. **ติดตั้ง Vercel CLI**
```bash
npm install -g vercel
```

2. **Login เข้า Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **ตั้งค่า Environment Variables ใน Vercel Dashboard**
- ไปที่ Project Settings > Environment Variables
- เพิ่ม environment variables ทั้งหมดจากไฟล์ `.env`

### Netlify

1. **Build command**: `npm run build`
2. **Publish directory**: `dist`
3. **ตั้งค่า Environment Variables ใน Netlify Dashboard**

### Firebase Hosting

1. **ติดตั้ง Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login เข้า Firebase**
```bash
firebase login
```

3. **Initialize Firebase Hosting**
```bash
firebase init hosting
```

4. **Build และ Deploy**
```bash
npm run build
firebase deploy --only hosting
```

## 🔒 ความปลอดภัย

- ใช้ Firebase Security Rules เพื่อควบคุมการเข้าถึงข้อมูล
- ไม่เก็บข้อมูลบัตรเครดิตในระบบ
- ใช้ HTTPS สำหรับการสื่อสาร
- Validate ข้อมูลทั้งฝั่ง client และ server
- ใช้ environment variables สำหรับข้อมูลที่เป็นความลับ

## 📊 Database Schema

### Collections

#### users
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  bio: string,
  role: 'user' | 'artist' | 'admin',
  credits: number,
  createdAt: timestamp
}
```

#### transactions
```javascript
{
  userId: string,
  type: 'credit' | 'debit' | 'transfer_in' | 'transfer_out',
  amount: number,
  description: string,
  fromUserId?: string,
  toUserId?: string,
  timestamp: timestamp
}
```

#### orders
```javascript
{
  orderId: string,
  buyerId: string,
  sellerId: string,
  productId: string,
  amount: number,
  status: 'pending' | 'completed' | 'cancelled',
  createdAt: timestamp
}
```

#### products
```javascript
{
  productId: string,
  sellerId: string,
  title: string,
  description: string,
  price: number,
  images: string[],
  category: string,
  createdAt: timestamp
}
```

#### jobs
```javascript
{
  jobId: string,
  clientId: string,
  artistId?: string,
  title: string,
  description: string,
  budget: number,
  status: 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled',
  createdAt: timestamp
}
```

#### stories
```javascript
{
  storyId: string,
  authorId: string,
  title: string,
  description: string,
  coverImage: string,
  chapters: array,
  createdAt: timestamp
}
```

## 🤝 การมีส่วนร่วม

เรายินดีรับ contributions! กรุณา:
1. Fork repository
2. สร้าง feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 ติดต่อ

หากมีคำถามหรือข้อเสนอแนะ กรุณาติดต่อผ่าน:
- Email: support@versecanvas.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/versecanvas/issues)

## 🙏 ขอบคุณ

- [React](https://react.dev/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Cloudinary](https://cloudinary.com/)
- [Lucide Icons](https://lucide.dev/)

---

Made with ❤️ by VerseCanvas Team

## 🚀 Backend API (Stripe Integration)

โปรเจคนี้มาพร้อมกับ Backend API สำหรับการชำระเงินผ่าน Stripe ซึ่งสามารถ deploy ได้บน Vercel หรือ Netlify

### 🔑 Environment Variables (Backend)

คุณต้องตั้งค่า Environment Variables เหล่านี้ใน Vercel/Netlify Dashboard:

- `STRIPE_SECRET_KEY`: Stripe Secret Key
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook Signing Secret
- `FIREBASE_PROJECT_ID`: Firebase Project ID
- `FIREBASE_CLIENT_EMAIL`: Firebase Client Email
- `FIREIPE_PRIVATE_KEY`: Firebase Private Key

ดูรายละเอียดเพิ่มเติมใน `STRIPE_BACKEND_GUIDE.md`

### 🚀 Deployment

- **Vercel**: Deploy ได้ทันที Vercel จะตรวจจับ `api` directory และ `vercel.json`
- **Netlify**: Deploy ได้ทันที Netlify จะตรวจจับ `functions` directory และ `netlify.toml`

ดูขั้นตอนการตั้งค่า chi tiết ใน `STRIPE_BACKEND_GUIDE.md`
