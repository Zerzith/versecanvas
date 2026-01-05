# คู่มือแก้ไขปัญหา Stripe Payment

## ปัญหาที่พบ
```
Error creating payment intent: SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data
```

## สาเหตุ
1. **API endpoint ไม่ทำงาน** - Backend API (`/api/create-payment-intent`) ไม่ได้ถูก deploy หรือไม่ทำงานบน Vercel
2. **Environment Variables ไม่ครบ** - `STRIPE_SECRET_KEY` ไม่ได้ตั้งค่าใน Vercel
3. **CORS issues** - Frontend ไม่สามารถเรียก API ได้

## วิธีแก้ไข

### ขั้นตอนที่ 1: ตรวจสอบ Environment Variables ใน Vercel
1. ไปที่ Vercel Dashboard → เลือกโปรเจค versecanvas
2. ไปที่ Settings → Environment Variables
3. ตรวจสอบว่ามีตัวแปรเหล่านี้:
   - `STRIPE_SECRET_KEY` = sk_test_... (หรือ sk_live_...)
   - `STRIPE_WEBHOOK_SECRET` = whsec_...
   - `VITE_STRIPE_PUBLISHABLE_KEY` = pk_test_... (หรือ pk_live_...)

### ขั้นตอนที่ 2: Redeploy โปรเจค
หลังจากตั้งค่า Environment Variables แล้ว ต้อง Redeploy:
```bash
# ใน Vercel Dashboard
Deployments → คลิก ... → Redeploy
```

หรือใช้ Git:
```bash
git add .
git commit -m "Fix: Update environment variables"
git push origin main
```

### ขั้นตอนที่ 3: ทดสอบ API โดยตรง
ทดสอบว่า API ทำงานหรือไม่:
```bash
curl -X POST https://versecanvas.vercel.app/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "thb", "metadata": {}}'
```

ผลลัพธ์ที่ถูกต้อง:
```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_...",
  "amount": 10000,
  "currency": "thb"
}
```

### ขั้นตอนที่ 4: ตรวจสอบ Stripe Dashboard
1. ไปที่ https://dashboard.stripe.com
2. ตรวจสอบว่า API Keys ถูกต้อง
3. ตรวจสอบว่าอยู่ใน Test Mode หรือ Live Mode

## หมายเหตุ
- ถ้ายังไม่ได้ deploy backend ให้ push code ขึ้น GitHub แล้ว Vercel จะ auto-deploy
- ตรวจสอบ logs ใน Vercel Dashboard → Deployments → คลิกที่ deployment ล่าสุด → Functions
- ถ้าใช้ Netlify แทน Vercel ให้ตรวจสอบ Netlify Functions แทน
