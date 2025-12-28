## 🚀 คู่มือการตั้งค่า Backend สำหรับ Stripe

เอกสารนี้อธิบายวิธีการตั้งค่าและ deploy Backend API สำหรับระบบเครดิต Stripe บน Vercel หรือ Netlify

---

## 🎯 ภาพรวม

Backend API มี 2 ส่วนหลัก:

1.  **Create Payment Intent**: สร้าง session การชำระเงินสำหรับ Frontend
    -   `api/create-payment-intent.js` (สำหรับ Vercel)
    -   `functions/create-payment-intent.js` (สำหรับ Netlify)
2.  **Webhook Handler**: รับ events จาก Stripe (เช่น `payment_intent.succeeded`) เพื่อเพิ่มเครดิตให้ผู้ใช้
    -   `api/webhook.js` (สำหรับ Vercel)
    -   `functions/webhook.js` (สำหรับ Netlify)

---

## 🔑 Environment Variables

คุณต้องตั้งค่า Environment Variables เหล่านี้ใน Vercel หรือ Netlify Dashboard

| Variable | คำอธิบาย | ตัวอย่าง |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL ของ Backend API (สำหรับ Frontend) | `https://your-app.vercel.app` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | `whsec_...` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Client Email | `firebase-adminsdk-...` |
| `FIREBASE_PRIVATE_KEY` | Firebase Private Key | `-----BEGIN PRIVATE KEY-----...` |

**วิธีหา Firebase Credentials:**
1.  ไปที่ Firebase Console > Project Settings > Service accounts
2.  คลิก "Generate new private key"
3.  คุณจะได้ไฟล์ JSON ที่มี `project_id`, `client_email`, และ `private_key`

**⚠️ สำคัญ:** สำหรับ `FIREBASE_PRIVATE_KEY` ให้คัดลอกข้อความทั้งหมดรวมถึง `-----BEGIN PRIVATE KEY-----` และ `-----END PRIVATE KEY-----` และใส่ `\n` แทนการขึ้นบรรทัดใหม่

---

## 🚀 วิธี Deploy

### 1. Vercel (แนะนำ)

Vercel จะตรวจจับ `vercel.json` และ `api` directory โดยอัตโนมัติ

**ขั้นตอน:**
1.  เชื่อมต่อ Git repository ของคุณกับ Vercel
2.  Vercel จะตรวจจับว่าเป็น Vite project
3.  ไปที่ Project Settings > Environment Variables
4.  เพิ่ม Environment Variables ทั้งหมดที่กล่าวมาข้างต้น
5.  Deploy!

**Endpoints ของคุณจะเป็น:**
-   `https://<your-app>.vercel.app/api/create-payment-intent`
-   `https://<your-app>.vercel.app/api/webhook`

### 2. Netlify

Netlify จะตรวจจับ `netlify.toml` และ `functions` directory

**ขั้นตอน:**
1.  เชื่อมต่อ Git repository ของคุณกับ Netlify
2.  Netlify จะตรวจจับว่าเป็น Vite project
3.  ไปที่ Site settings > Build & deploy > Environment
4.  เพิ่ม Environment Variables ทั้งหมด
5.  Deploy!

**Endpoints ของคุณจะเป็น:**
-   `https://<your-app>.netlify.app/.netlify/functions/create-payment-intent`
-   `https://<your-app>.netlify.app/.netlify/functions/webhook`

**⚠️ สำคัญสำหรับ Netlify:**
-   คุณต้องตั้งค่า `VITE_API_BASE_URL` เป็น `https://<your-app>.netlify.app/.netlify/functions`

---

## 🎣 การตั้งค่า Stripe Webhook

1.  ไปที่ [Stripe Webhooks Dashboard](https://dashboard.stripe.com/webhooks)
2.  คลิก "Add endpoint"
3.  **Endpoint URL**: ใส่ URL ของ webhook handler ของคุณ
    -   Vercel: `https://<your-app>.vercel.app/api/webhook`
    -   Netlify: `https://<your-app>.netlify.app/.netlify/functions/webhook`
4.  **Events to send**: เลือก events เหล่านี้:
    -   `payment_intent.succeeded`
    -   `payment_intent.payment_failed`
    -   `payment_intent.canceled`
    -   `charge.refunded`
5.  คลิก "Add endpoint"
6.  คัดลอก **Signing secret** (`whsec_...`) และนำไปใส่ใน `STRIPE_WEBHOOK_SECRET`

---

## 🧪 การทดสอบ (Local Development)

### 1. ติดตั้ง Stripe CLI

```bash
brew install stripe/stripe-cli/stripe
```

### 2. Forward Webhooks

```bash
# สำหรับ Vercel (รัน `vercel dev`)
stripe listen --forward-to localhost:3000/api/webhook

# สำหรับ Netlify (รัน `netlify dev`)
stripe listen --forward-to localhost:8888/.netlify/functions/webhook
```

3.  Stripe CLI จะให้ Webhook Secret สำหรับทดสอบ (`whsec_...`) ให้ใช้ key นี้ใน `.env.local`

---

## 📁 โครงสร้างไฟล์

```
versecanvas-final/
├── api/                      # Vercel Serverless Functions
│   ├── create-payment-intent.js
│   └── webhook.js
├── functions/                # Netlify Functions
│   ├── create-payment-intent.js
│   └── webhook.js
├── src/
│   ├── lib/
│   │   └── stripeApi.js      # Frontend API calls
│   └── pages/
│       └── Credits.jsx         # Frontend page
├── vercel.json               # Vercel config
└── netlify.toml              # Netlify config
```

---

## ✅ สรุป

1.  Deploy project ของคุณไปยัง Vercel หรือ Netlify
2.  ตั้งค่า Environment Variables ทั้งหมด
3.  ตั้งค่า Stripe Webhook ให้ชี้ไปยัง Backend API ของคุณ
4.  คัดลอก Webhook Secret และใส่ใน Environment Variables
5.  ทดสอบการชำระเงิน!
