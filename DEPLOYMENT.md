# คำแนะนำการ Deploy VerseCanvas

เอกสารนี้จะแนะนำวิธีการ deploy โปรเจค VerseCanvas ไปยังแพลตฟอร์มต่างๆ

## 📋 เตรียมความพร้อมก่อน Deploy

### 1. ตรวจสอบ Environment Variables

ตรวจสอบว่าคุณมี environment variables ครบถ้วน:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### 2. ตั้งค่า Firebase Security Rules

ก่อน deploy ต้องตั้งค่า Security Rules ให้เรียบร้อย (ดูรายละเอียดใน README.md)

### 3. Build และทดสอบ

```bash
npm run build
npm run preview
```

เปิดเบราว์เซอร์ที่ `http://localhost:4173` และทดสอบการทำงาน

## 🚀 Deploy ไปยัง Vercel (แนะนำ)

Vercel เป็นตัวเลือกที่ดีที่สุดสำหรับ React + Vite applications

### วิธีที่ 1: Deploy ผ่าน Vercel Dashboard (ง่ายที่สุด)

1. **Push โค้ดไปยัง GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/versecanvas.git
git push -u origin main
```

2. **เชื่อมต่อกับ Vercel**
- ไปที่ [vercel.com](https://vercel.com)
- คลิก "Add New Project"
- Import repository จาก GitHub
- Vercel จะตรวจจับ Vite configuration อัตโนมัติ

3. **ตั้งค่า Environment Variables**
- ไปที่ Project Settings > Environment Variables
- เพิ่ม environment variables ทั้งหมด
- คลิก "Deploy"

### วิธีที่ 2: Deploy ผ่าน Vercel CLI

1. **ติดตั้ง Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **ตั้งค่า Environment Variables**
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# ... เพิ่มทั้งหมด
```

5. **Deploy Production**
```bash
vercel --prod
```

### การตั้งค่า Custom Domain

1. ไปที่ Project Settings > Domains
2. เพิ่ม domain ของคุณ
3. ตั้งค่า DNS ตามคำแนะนำ

## 🌐 Deploy ไปยัง Netlify

### วิธีที่ 1: Deploy ผ่าน Netlify Dashboard

1. **Push โค้ดไปยัง GitHub** (ถ้ายังไม่ได้ทำ)

2. **เชื่อมต่อกับ Netlify**
- ไปที่ [netlify.com](https://netlify.com)
- คลิก "Add new site" > "Import an existing project"
- เชื่อมต่อกับ GitHub และเลือก repository

3. **ตั้งค่า Build Settings**
- Build command: `npm run build`
- Publish directory: `dist`

4. **ตั้งค่า Environment Variables**
- ไปที่ Site settings > Environment variables
- เพิ่ม environment variables ทั้งหมด

5. **Deploy**

### วิธีที่ 2: Deploy ผ่าน Netlify CLI

1. **ติดตั้ง Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Initialize**
```bash
netlify init
```

4. **Deploy**
```bash
netlify deploy --prod
```

### การตั้งค่า Redirects สำหรับ SPA

สร้างไฟล์ `public/_redirects`:
```
/*    /index.html   200
```

## 🔥 Deploy ไปยัง Firebase Hosting

### 1. ติดตั้ง Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login เข้า Firebase

```bash
firebase login
```

### 3. Initialize Firebase Hosting

```bash
firebase init hosting
```

เลือกตัวเลือกดังนี้:
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds with GitHub: `No` (หรือ `Yes` ถ้าต้องการ)

### 4. Build โปรเจค

```bash
npm run build
```

### 5. Deploy

```bash
firebase deploy --only hosting
```

### 6. ตั้งค่า Environment Variables

Firebase Hosting ไม่รองรับ environment variables โดยตรง มี 2 วิธี:

**วิธีที่ 1: Build ก่อน Deploy**
```bash
# ตั้งค่า environment variables ในเครื่อง
npm run build
firebase deploy --only hosting
```

**วิธีที่ 2: ใช้ Firebase Functions**
- สร้าง Firebase Functions เพื่อเก็บ environment variables
- เรียกใช้ผ่าน API

### การตั้งค่า Custom Domain

```bash
firebase hosting:channel:deploy production
```

จากนั้นไปที่ Firebase Console > Hosting > Add custom domain

## 🐙 Deploy ไปยัง GitHub Pages

### 1. ติดตั้ง gh-pages

```bash
npm install --save-dev gh-pages
```

### 2. แก้ไข vite.config.js

```javascript
export default defineConfig({
  base: '/versecanvas/', // ชื่อ repository
  plugins: [react()],
  // ... config อื่นๆ
})
```

### 3. เพิ่ม scripts ใน package.json

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### 4. Deploy

```bash
npm run deploy
```

### 5. ตั้งค่า GitHub Pages

- ไปที่ Repository Settings > Pages
- Source: gh-pages branch
- Save

**หมายเหตุ**: GitHub Pages ไม่รองรับ environment variables ที่เป็นความลับ ไม่แนะนำสำหรับ production

## 🐳 Deploy ด้วย Docker

### 1. สร้าง Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. สร้าง nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. สร้าง docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
      - VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
      - VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
      - VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
      - VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
      - VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
      - VITE_FIREBASE_DATABASE_URL=${VITE_FIREBASE_DATABASE_URL}
      - VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME}
      - VITE_CLOUDINARY_UPLOAD_PRESET=${VITE_CLOUDINARY_UPLOAD_PRESET}
```

### 4. Build และ Run

```bash
docker-compose up -d
```

## 🔍 การตรวจสอบหลัง Deploy

### 1. ตรวจสอบการทำงาน
- [ ] เข้าสู่ระบบได้
- [ ] สมัครสมาชิกได้
- [ ] อัปโหลดรูปภาพได้
- [ ] ระบบเครดิตทำงาน
- [ ] สร้างและแก้ไขเนื้อหาได้
- [ ] ซื้อขายสินค้าได้
- [ ] ส่งข้อความได้
- [ ] การแจ้งเตือนทำงาน

### 2. ตรวจสอบ Performance
```bash
# ใช้ Lighthouse
npm install -g lighthouse
lighthouse https://your-domain.com --view
```

### 3. ตรวจสอบ Security
- [ ] HTTPS ทำงาน
- [ ] Firebase Security Rules ถูกต้อง
- [ ] ไม่มี API keys โผล่ในโค้ด
- [ ] CORS ตั้งค่าถูกต้อง

## 🔧 Troubleshooting

### ปัญหา: Build ไม่สำเร็จ

**แก้ไข:**
```bash
# ลบ node_modules และ lock files
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ปัญหา: Environment Variables ไม่ทำงาน

**แก้ไข:**
- ตรวจสอบว่าขึ้นต้นด้วย `VITE_`
- ตรวจสอบว่าตั้งค่าในแพลตฟอร์ม deploy
- Redeploy หลังจากเพิ่ม environment variables

### ปัญหา: Routing ไม่ทำงาน (404 Error)

**แก้ไข:**
- ตรวจสอบ SPA configuration
- เพิ่ม redirects/rewrites rules
- สำหรับ Vercel: ไฟล์ `vercel.json` มีอยู่แล้ว
- สำหรับ Netlify: เพิ่มไฟล์ `public/_redirects`

### ปัญหา: Firebase Connection Error

**แก้ไข:**
- ตรวจสอบ Firebase configuration
- ตรวจสอบว่าเปิดใช้งาน services ที่จำเป็น
- ตรวจสอบ Security Rules

### ปัญหา: Cloudinary Upload ไม่ทำงาน

**แก้ไข:**
- ตรวจสอบ Upload Preset
- ตรวจสอบว่าเป็น unsigned preset
- ตรวจสอบ CORS settings ใน Cloudinary

## 📊 Monitoring และ Analytics

### 1. Firebase Analytics
```javascript
// เพิ่มใน src/lib/firebase.js
import { getAnalytics } from 'firebase/analytics';
export const analytics = getAnalytics(app);
```

### 2. Vercel Analytics
```bash
npm install @vercel/analytics
```

```javascript
// เพิ่มใน src/main.jsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

### 3. Google Analytics
- เพิ่ม tracking code ใน `index.html`

## 🔄 Continuous Deployment

### GitHub Actions (แนะนำ)

สร้างไฟล์ `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_CLOUDINARY_CLOUD_NAME: ${{ secrets.VITE_CLOUDINARY_CLOUD_NAME }}
          VITE_CLOUDINARY_UPLOAD_PRESET: ${{ secrets.VITE_CLOUDINARY_UPLOAD_PRESET }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📝 Checklist ก่อน Deploy Production

- [ ] ทดสอบทุกฟีเจอร์ใน development
- [ ] ตั้งค่า Firebase Security Rules
- [ ] ตั้งค่า environment variables
- [ ] เพิ่ม custom domain
- [ ] ตั้งค่า SSL/HTTPS
- [ ] ทดสอบ responsive design
- [ ] ทดสอบ cross-browser compatibility
- [ ] ตั้งค่า analytics
- [ ] ตั้งค่า error monitoring (Sentry)
- [ ] สร้าง backup plan
- [ ] เตรียมเอกสารสำหรับผู้ใช้
- [ ] ทดสอบ performance
- [ ] ตรวจสอบ SEO

## 🎉 เสร็จสิ้น!

เว็บไซต์ของคุณพร้อมใช้งานแล้ว! 🚀

หากมีปัญหาหรือคำถาม กรุณาติดต่อทีมพัฒนา
