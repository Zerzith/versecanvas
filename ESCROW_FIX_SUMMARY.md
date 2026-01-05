# สรุปการแก้ไขปัญหาปุ่มตรวจสอบผลงาน

**วันที่:** 5 มกราคม 2026

## ปัญหาที่รายงาน
> "หน้า escrow และ artseek ไม่มีปุ่มตรวจสอบผลงานให้กับคนจ้างเลย ถึงแม้จะมีปุ่ม กดไปก็ไม่เด้งให้ดูรูปและยืนยันผลงานด้วยซ้ำ"

## การวิเคราะห์ปัญหา

### 1. ความเข้าใจผิดเกี่ยวกับหน้า Artseek
**Artseek** เป็นหน้าค้นหางาน (Job Listing) ไม่ใช่หน้าจัดการงาน
- แสดงรายการงานที่เปิดรับสมัคร
- ไม่มีปุ่มตรวจสอบผลงาน เพราะเป็นหน้าสำหรับหางานเท่านั้น

### 2. ปัญหาจริงในหน้า EscrowManagement
**สาเหตุ:** เมื่อศิลปินส่งงาน ระบบบันทึก URL รูปใน `workSubmissions` collection แต่ไม่ได้บันทึกใน `jobs` collection

**ผลกระทบ:**
- ปุ่ม "ดูงาน (มีลายน้ำ)" ใน EscrowManagement กดแล้วไม่เกิดอะไร
- เพราะ `job.watermarkedWorkUrl` เป็น `null`

## การแก้ไข

### ✅ 1. แก้ไข handleSubmitWork ใน EscrowManagement.jsx
**ไฟล์:** `src/pages/EscrowManagement.jsx` (บรรทัด 139-146)

**เปลี่ยนจาก:**
```jsx
await updateDoc(doc(db, 'jobs', selectedJob.id), {
  status: 'submitted',
  workSubmitted: true,
  workSubmittedAt: serverTimestamp(),
  latestSubmissionId: submissionRef.id
});
```

**เป็น:**
```jsx
await updateDoc(doc(db, 'jobs', selectedJob.id), {
  status: 'submitted',
  workSubmitted: true,
  workSubmittedAt: serverTimestamp(),
  latestSubmissionId: submissionRef.id,
  watermarkedWorkUrl: watermarkedUrl,  // ← เพิ่มบรรทัดนี้
  submittedWorkUrl: originalUrl         // ← เพิ่มบรรทัดนี้
});
```

**ผลลัพธ์:** ตอนนี้เมื่อศิลปินส่งงาน URL รูปจะถูกบันทึกใน jobs collection ด้วย

---

### ✅ 2. เพิ่มการตรวจสอบ URL และ fallback
**ไฟล์:** `src/pages/EscrowManagement.jsx` (บรรทัด 461-479)

**เปลี่ยนจาก:**
```jsx
{job.status === 'submitted' && (
  <>
    <button onClick={() => window.open(job.watermarkedWorkUrl || job.submittedWorkUrl, '_blank')}>
      <Eye size={16} />
      ดูงาน (มีลายน้ำ)
    </button>
    {/* ... */}
  </>
)}
```

**เป็น:**
```jsx
{job.status === 'submitted' && (
  <>
    {(job.watermarkedWorkUrl || job.submittedWorkUrl) ? (
      <button onClick={() => window.open(job.watermarkedWorkUrl || job.submittedWorkUrl, '_blank')}>
        <Eye size={16} />
        ดูงาน (มีลายน้ำ)
      </button>
    ) : (
      <Link to={`/job/${job.id}/review`}>
        <Eye size={16} />
        ดูงาน
      </Link>
    )}
    {/* ... */}
  </>
)}
```

**ผลลัพธ์:** 
- ถ้ามี URL รูปใน job → เปิดรูปใน tab ใหม่
- ถ้าไม่มี URL → ลิงก์ไปหน้า ClientJobReview ซึ่งจะดึงข้อมูลจาก workSubmissions

---

## หน้าที่มีปุ่มตรวจสอบผลงานสำหรับคนจ้าง

### 1. ✅ JobManagement (`/orders`)
**ปุ่มเมื่อ status = 'submitted':**
- "ยืนยันรับงาน" → ลิงก์ไปที่ `/job/${job.id}/review`
- "ร้องเรียน" → ลิงก์ไปที่ `/job/${job.id}/dispute`

### 2. ✅ EscrowManagement (`/escrow`)
**ปุ่มเมื่อ status = 'submitted':**
- "ดูงาน (มีลายน้ำ)" → เปิดรูป หรือลิงก์ไปหน้า review
- "ยืนยันงาน" → ยืนยันและปล่อยเครดิต
- "ขอแก้ไข" → เปิด modal revision
- "ร้องเรียน" → เปิด modal dispute

### 3. ✅ ClientJobReview (`/job/:jobId/review`)
**ฟีเจอร์:**
- แสดงรูปที่มี watermark
- ปุ่ม "ยืนยันรับงาน"
- ปุ่ม "ขอแก้ไข"
- ปุ่ม "ยกเลิกงาน"
- ปุ่ม "ดาวน์โหลด"

---

## ไฟล์ที่มีการเปลี่ยนแปลง

1. ✅ `src/pages/EscrowManagement.jsx`
   - เพิ่มการบันทึก `watermarkedWorkUrl` และ `submittedWorkUrl` ใน jobs collection
   - เพิ่มการตรวจสอบ URL และ fallback ไปหน้า ClientJobReview

---

## ขั้นตอนการทดสอบ

1. **ศิลปินส่งงาน:**
   - ไปที่หน้า EscrowManagement (tab "งานที่รับ")
   - คลิกปุ่ม "ส่งงาน"
   - อัปโหลดรูปภาพ
   - ตรวจสอบว่าระบบบันทึก URL ใน jobs collection

2. **คนจ้างดูงาน:**
   - ไปที่หน้า EscrowManagement (tab "งานที่จ้าง")
   - ควรเห็นปุ่ม "ดูงาน (มีลายน้ำ)"
   - คลิกแล้วควรเปิดรูปใน tab ใหม่

3. **คนจ้างยืนยันงาน:**
   - คลิกปุ่ม "ยืนยันงาน"
   - ตรวจสอบว่าเครดิตถูกโอนให้ศิลปิน
   - งานเปลี่ยนสถานะเป็น "completed"

---

## หมายเหตุ

- **Artseek** เป็นหน้าค้นหางาน ไม่ใช่หน้าจัดการงาน
- หน้าจัดการงานสำหรับคนจ้างคือ **JobManagement** (`/orders`) และ **EscrowManagement** (`/escrow`)
- ClientJobReview จะดึงข้อมูลจาก `workSubmissions` collection ดังนั้นแม้ jobs collection ไม่มี URL ก็ยังดูงานได้
