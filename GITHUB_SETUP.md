# คำแนะนำการอัปโหลดโปรเจคไปยัง GitHub

เอกสารนี้จะแนะนำวิธีการอัปโหลดโปรเจค VerseCanvas ไปยัง GitHub และตั้งค่าต่างๆ ที่จำเป็น

## 📋 เตรียมความพร้อม

### 1. ติดตั้ง Git

ตรวจสอบว่าคุณมี Git ติดตั้งอยู่แล้วหรือไม่:

```bash
git --version
```

หากยังไม่มี ติดตั้งได้จาก [git-scm.com](https://git-scm.com/)

### 2. สร้างบัญชี GitHub

หากยังไม่มีบัญชี GitHub สมัครได้ที่ [github.com](https://github.com/)

### 3. ตั้งค่า Git Configuration

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🚀 อัปโหลดโปรเจคไปยัง GitHub

### วิธีที่ 1: ผ่าน GitHub Desktop (ง่ายที่สุด)

#### 1. ดาวน์โหลด GitHub Desktop

ดาวน์โหลดและติดตั้งจาก [desktop.github.com](https://desktop.github.com/)

#### 2. Login เข้า GitHub

เปิด GitHub Desktop และ login ด้วยบัญชี GitHub ของคุณ

#### 3. เพิ่มโปรเจค

- คลิก "File" > "Add Local Repository"
- เลือกโฟลเดอร์ `versecanvas-final`
- หากยังไม่ได้ initialize git จะมีปุ่มให้คลิก "Create a repository"

#### 4. Commit Changes

- เขียน commit message เช่น "Initial commit"
- คลิก "Commit to main"

#### 5. Publish to GitHub

- คลิก "Publish repository"
- ตั้งชื่อ repository: `versecanvas`
- เลือก Public หรือ Private
- คลิก "Publish repository"

เสร็จสิ้น! โปรเจคของคุณอยู่บน GitHub แล้ว

### วิธีที่ 2: ผ่าน Command Line

#### 1. เข้าไปในโฟลเดอร์โปรเจค

```bash
cd versecanvas-final
```

#### 2. Initialize Git Repository

```bash
git init
```

#### 3. เพิ่มไฟล์ทั้งหมด

```bash
git add .
```

#### 4. Commit

```bash
git commit -m "Initial commit: VerseCanvas platform with credit system"
```

#### 5. สร้าง Repository บน GitHub

- ไปที่ [github.com/new](https://github.com/new)
- ตั้งชื่อ repository: `versecanvas`
- เลือก Public หรือ Private
- **ไม่ต้อง** เลือก "Initialize this repository with a README"
- คลิก "Create repository"

#### 6. เชื่อมต่อกับ GitHub

```bash
git remote add origin https://github.com/yourusername/versecanvas.git
git branch -M main
git push -u origin main
```

เปลี่ยน `yourusername` เป็นชื่อผู้ใช้ GitHub ของคุณ

## 🔐 การจัดการ Environment Variables

**สำคัญ**: ห้ามอัปโหลดไฟล์ `.env` ไปยัง GitHub!

### 1. ตรวจสอบ .gitignore

ตรวจสอบว่าไฟล์ `.gitignore` มีบรรทัดนี้:

```
.env
.env.local
```

### 2. ใช้ .env.example

ไฟล์ `.env.example` ถูกอัปโหลดไปแล้ว ซึ่งแสดงโครงสร้างของ environment variables โดยไม่มีค่าจริง

### 3. คำแนะนำสำหรับผู้ใช้งาน

เพิ่มคำแนะนำใน README.md:

```markdown
## การตั้งค่า Environment Variables

1. คัดลอกไฟล์ `.env.example` เป็น `.env`
2. กรอกค่าจริงใน `.env`
```

## 📝 การเขียน README.md ที่ดี

README.md ที่ดีควรมี:

- ✅ ชื่อโปรเจคและคำอธิบายสั้นๆ
- ✅ Screenshot หรือ Demo
- ✅ ฟีเจอร์หลัก
- ✅ เทคโนโลยีที่ใช้
- ✅ วิธีการติดตั้ง
- ✅ วิธีการรัน
- ✅ การตั้งค่า environment variables
- ✅ วิธีการ deploy
- ✅ License
- ✅ ข้อมูลติดต่อ

README.md ที่มีอยู่แล้วครบถ้วนทุกข้อ!

## 🏷️ การใช้ Git Tags

### สร้าง Tag สำหรับ Version

```bash
git tag -a v1.0.0 -m "Version 1.0.0 - Initial release"
git push origin v1.0.0
```

### ดู Tags ทั้งหมด

```bash
git tag
```

## 🌿 การจัดการ Branches

### สร้าง Branch ใหม่

```bash
git checkout -b feature/new-feature
```

### สลับ Branch

```bash
git checkout main
```

### Merge Branch

```bash
git checkout main
git merge feature/new-feature
```

### ลบ Branch

```bash
git branch -d feature/new-feature
```

## 🔄 การอัปเดตโปรเจค

### เมื่อมีการแก้ไข

```bash
# 1. ดูไฟล์ที่เปลี่ยนแปลง
git status

# 2. เพิ่มไฟล์ที่ต้องการ commit
git add .
# หรือเพิ่มเฉพาะไฟล์
git add src/pages/NewPage.jsx

# 3. Commit
git commit -m "Add: New feature description"

# 4. Push ไปยัง GitHub
git push origin main
```

### Commit Message Guidelines

ใช้รูปแบบที่ชัดเจน:

- `Add: เพิ่มฟีเจอร์ใหม่`
- `Fix: แก้ไขบั๊ก`
- `Update: อัปเดตฟีเจอร์`
- `Remove: ลบโค้ดที่ไม่ใช้`
- `Refactor: ปรับปรุงโครงสร้างโค้ด`
- `Docs: อัปเดตเอกสาร`
- `Style: แก้ไข formatting`
- `Test: เพิ่ม/แก้ไข tests`

## 🤝 การทำงานร่วมกับทีม

### Clone Repository

```bash
git clone https://github.com/yourusername/versecanvas.git
cd versecanvas
```

### Pull การเปลี่ยนแปลงล่าสุด

```bash
git pull origin main
```

### สร้าง Pull Request

1. สร้าง branch ใหม่
2. ทำการแก้ไข
3. Push branch ไปยัง GitHub
4. ไปที่ GitHub และคลิก "New Pull Request"
5. เขียนรายละเอียดการเปลี่ยนแปลง
6. รอทีมรีวิว

## 🔒 การตั้งค่า GitHub Secrets

สำหรับ CI/CD และ GitHub Actions

### 1. ไปที่ Repository Settings

- คลิก "Settings" ใน repository
- เลือก "Secrets and variables" > "Actions"

### 2. เพิ่ม Secrets

คลิก "New repository secret" และเพิ่ม:

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | ค่าจาก .env |
| `VITE_FIREBASE_AUTH_DOMAIN` | ค่าจาก .env |
| `VITE_FIREBASE_PROJECT_ID` | ค่าจาก .env |
| `VITE_FIREBASE_STORAGE_BUCKET` | ค่าจาก .env |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ค่าจาก .env |
| `VITE_FIREBASE_APP_ID` | ค่าจาก .env |
| `VITE_FIREBASE_DATABASE_URL` | ค่าจาก .env |
| `VITE_CLOUDINARY_CLOUD_NAME` | ค่าจาก .env |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ค่าจาก .env |

### 3. ใช้ใน GitHub Actions

Secrets เหล่านี้จะใช้ใน workflow file (`.github/workflows/deploy.yml`)

## 📊 GitHub Pages (ถ้าต้องการ)

### เปิดใช้งาน GitHub Pages

1. ไปที่ Settings > Pages
2. เลือก Source: GitHub Actions
3. เลือก workflow: Static HTML
4. Save

### แก้ไข vite.config.js

```javascript
export default defineConfig({
  base: '/versecanvas/', // ชื่อ repository
  // ... config อื่นๆ
})
```

### เพิ่ม workflow file

สร้างไฟล์ `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
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
          # ... เพิ่ม secrets อื่นๆ
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🏆 Best Practices

### 1. Commit บ่อยๆ

Commit เมื่อทำงานเสร็จแต่ละส่วนเล็กๆ ไม่ต้องรอให้เสร็จทั้งหมด

### 2. เขียน Commit Message ที่ดี

- ใช้ Present tense: "Add feature" ไม่ใช่ "Added feature"
- เขียนให้สั้นและชัดเจน
- อธิบายว่าทำอะไรและทำไม

### 3. ใช้ .gitignore

อย่าอัปโหลดไฟล์ที่ไม่จำเป็น:
- `node_modules/`
- `dist/`
- `.env`
- `.DS_Store`
- `*.log`

### 4. Pull ก่อน Push

```bash
git pull origin main
git push origin main
```

### 5. ใช้ Branch สำหรับ Feature ใหม่

อย่าทำงานโดยตรงบน main branch

### 6. Code Review

ใช้ Pull Request เพื่อให้ทีมรีวิวโค้ดก่อน merge

### 7. ใช้ GitHub Issues

- สร้าง issue สำหรับบั๊กและฟีเจอร์ใหม่
- ใช้ labels เพื่อจัดหมวดหมู่
- อ้างอิง issue ใน commit message: `Fix #123`

### 8. เขียนเอกสาร

- อัปเดต README.md เมื่อมีการเปลี่ยนแปลง
- เขียน comments ในโค้ด
- สร้าง Wiki สำหรับเอกสารเพิ่มเติม

## 🔧 Troubleshooting

### ปัญหา: Push ไม่ได้

**สาเหตุ**: ไม่มีสิทธิ์ในการ push

**แก้ไข**:
```bash
# ตรวจสอบ remote URL
git remote -v

# แก้ไข remote URL
git remote set-url origin https://github.com/yourusername/versecanvas.git
```

### ปัญหา: Merge Conflict

**แก้ไข**:
```bash
# 1. Pull ล่าสุด
git pull origin main

# 2. แก้ไขไฟล์ที่ conflict
# 3. เพิ่มไฟล์ที่แก้แล้ว
git add .

# 4. Commit
git commit -m "Resolve merge conflict"

# 5. Push
git push origin main
```

### ปัญหา: ลืม .gitignore ไฟล์ที่ไม่ต้องการ

**แก้ไข**:
```bash
# ลบไฟล์ออกจาก git แต่เก็บไว้ในเครื่อง
git rm --cached .env
git commit -m "Remove .env from git"
git push origin main
```

### ปัญหา: ต้องการยกเลิก commit ล่าสุด

**แก้ไข**:
```bash
# Soft reset (เก็บการเปลี่ยนแปลง)
git reset --soft HEAD~1

# Hard reset (ลบการเปลี่ยนแปลง)
git reset --hard HEAD~1
```

### ปัญหา: อัปโหลด node_modules ไปแล้ว

**แก้ไข**:
```bash
# 1. เพิ่ม node_modules ใน .gitignore
echo "node_modules/" >> .gitignore

# 2. ลบออกจาก git
git rm -r --cached node_modules
git commit -m "Remove node_modules from git"
git push origin main
```

## 📚 เอกสารเพิ่มเติม

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com/)
- [GitHub Learning Lab](https://lab.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

## 🎯 Checklist ก่อนอัปโหลด

- [ ] ตรวจสอบว่าไม่มีไฟล์ `.env` ใน git
- [ ] ตรวจสอบว่าไม่มี `node_modules/` ใน git
- [ ] ตรวจสอบว่าไม่มี API keys หรือ secrets ในโค้ด
- [ ] เขียน README.md ที่ครบถ้วน
- [ ] เพิ่มไฟล์ `.env.example`
- [ ] เพิ่มไฟล์ LICENSE
- [ ] ทดสอบว่า build ได้
- [ ] เขียน commit message ที่ดี
- [ ] ตรวจสอบ .gitignore

## ✅ เสร็จสิ้น!

ตอนนี้โปรเจคของคุณพร้อมอยู่บน GitHub แล้ว! 🎉

คุณสามารถแชร์ลิงก์ repository กับคนอื่นได้:
```
https://github.com/yourusername/versecanvas
```

---

**หมายเหตุ**: เปลี่ยน `yourusername` เป็นชื่อผู้ใช้ GitHub ของคุณในทุกที่
