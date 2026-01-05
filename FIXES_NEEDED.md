# รายการปัญหาที่ต้องแก้ไข

## 1. ปัญหาการยืนยันงาน (Job Confirmation)
**ปัญหา:** ปุ่ม "ยืนยันรับงาน" ใน JobManagement.jsx ลิงก์ไปที่ `/job/${job.id}/confirm` แต่ใน App.jsx มี route เป็น `/job/:jobId/review`

**แก้ไข:**
- เปลี่ยน route ใน JobManagement.jsx จาก `/job/${job.id}/confirm` เป็น `/job/${job.id}/review`

---

## 2. ปัญหาปุ่มส่งข้อความในหน้าโปรไฟล์
**ปัญหา:** ปุ่มส่งข้อความในหน้า Profile ไม่ทำงานเหมือนหน้า Artseek

**ต้องตรวจสอบ:**
- ไฟล์ Profile.jsx
- ไฟล์ Artseek.jsx เพื่อดูว่าปุ่มส่งข้อความทำงานอย่างไร

---

## 3. ปัญหาการเติมเครดิต (Stripe Payment)
**ปัญหา:** Error: `JSON.parse: unexpected character at line 1 column 1 of the JSON data`

**สาเหตุที่เป็นไปได้:**
- API endpoint สำหรับ Stripe payment intent ไม่ return JSON
- Backend API (Vercel/Netlify functions) อาจไม่ทำงาน
- Environment variables สำหรับ Stripe ไม่ถูกต้อง

**ต้องตรวจสอบ:**
- ไฟล์ Credits.jsx หรือ StripePayment.jsx
- ไฟล์ใน /api หรือ /functions สำหรับ backend

---

## 4. ปัญหาปุ่มแสดงความคิดเห็นในหน้าผลงานรูป
**ปัญหา:** ไม่สามารถกดปุ่มแสดงความคิดเห็นได้

**ต้องตรวจสอบ:**
- ไฟล์ Artworks.jsx หรือหน้าที่แสดงผลงานรูป
- Component CommentSection.jsx
