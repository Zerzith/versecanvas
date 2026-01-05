# สรุปการแก้ไขปัญหาปุ่มตรวจสอบงาน (รอบ 2)

**วันที่:** 5 มกราคม 2026

## ปัญหาที่รายงาน (จากภาพหน้าจอ)

### ปัญหา 1: ไม่มีปุ่มตรวจสอบงานในหน้า Escrow
**จากภาพ:**
- หน้า Escrow แสดงงาน 2 งาน ในแท็บ "งานที่จ้าง"
- งานทั้งสองมีสถานะ "กำลังทำงาน" (badge สีน้ำเงิน)
- **ไม่มีปุ่มตรวจสอบงานเลย** ทั้งที่นักวาดส่งงานมาแล้ว

**สาเหตุ:**
- ปุ่มจะแสดงเฉพาะเมื่อ `job.status === 'submitted'`
- แต่สถานะงานยังเป็น `'in_progress'` หรือ `'กำลังทำงาน'`
- แสดงว่าเมื่อนักวาดส่งงาน สถานะไม่ได้เปลี่ยนเป็น `'submitted'`

### ปัญหา 2: ปุ่มตรวจสอบงานกดแล้วกลับไปหน้าแรก
**จากภาพ:**
- หน้ารายละเอียดงาน "งานวาดปกอัลบั้ม"
- มีปุ่ม "ตรวจสอบงาน" (สีเขียว)
- **กดแล้วกลับไปหน้าแรก**

**สาเหตุ:**
- ปุ่มลิงก์ไปที่ `/job/${jobId}/review` (ClientJobReview)
- ClientJobReview ตรวจสอบว่า `jobData.clientId === currentUser.uid`
- แต่ jobs collection ใช้ field **`userId`** ไม่ใช่ **`clientId`**
- ทำให้การตรวจสอบสิทธิ์ผิดพลาด และ redirect กลับไปหน้าแรก

---

## การแก้ไข

### ✅ 1. แก้ไข checkWorkSubmission ใน JobDetail.jsx
**ไฟล์:** `src/pages/JobDetail.jsx` (บรรทัด 40-56)

**ปัญหาเดิม:**
```jsx
const checkWorkSubmission = async () => {
  if (!currentUser || !jobId) return;
  try {
    const q = query(
      collection(db, 'workSubmissions'),
      where('jobId', '==', jobId),
      where('status', '==', 'pending')  // ← เฉพาะ pending เท่านั้น
    );
    const querySnapshot = await getDocs(q);
    setWorkSubmitted(!querySnapshot.empty);
  } catch (error) {
    console.error('Error checking work submission:', error);
  }
};
```

**แก้ไขเป็น:**
```jsx
const checkWorkSubmission = async () => {
  if (!currentUser || !jobId) return;
  try {
    const q = query(
      collection(db, 'workSubmissions'),
      where('jobId', '==', jobId)  // ← ดึงทั้งหมด
    );
    const querySnapshot = await getDocs(q);
    // ตรวจสอบว่ามี submission ที่ไม่ใช่ rejected
    const hasValidSubmission = querySnapshot.docs.some(
      doc => doc.data().status !== 'rejected'
    );
    setWorkSubmitted(hasValidSubmission);
  } catch (error) {
    console.error('Error checking work submission:', error);
  }
};
```

**ผลลัพธ์:** ✅ ตอนนี้จะตรวจสอบว่ามีงานส่งมาหรือไม่ โดยไม่สนใจ status (ยกเว้น rejected)

---

### ✅ 2. แก้ไขการตรวจสอบสิทธิ์ใน ClientJobReview.jsx
**ไฟล์:** `src/pages/ClientJobReview.jsx` (บรรทัด 44-50)

**ปัญหาเดิม:**
```jsx
const jobData = { id: jobDoc.id, ...jobDoc.data() };
if (jobData.clientId !== currentUser.uid) {  // ← ใช้ clientId
  toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
  navigate('/');  // ← กลับไปหน้าแรก
  return;
}
```

**แก้ไขเป็น:**
```jsx
const jobData = { id: jobDoc.id, ...jobDoc.data() };
// ตรวจสอบว่าเป็นเจ้าของงานหรือไม่ (ใช้ userId แทน clientId)
if (jobData.userId !== currentUser.uid && jobData.clientId !== currentUser.uid) {
  toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
  navigate('/');
  return;
}
```

**ผลลัพธ์:** ✅ ตอนนี้จะตรวจสอบทั้ง `userId` และ `clientId` เพื่อรองรับทั้งสองกรณี

---

## ⚠️ ปัญหาที่ยังเหลือ: สถานะงานไม่เปลี่ยน

**ปัญหา:**
- เมื่อนักวาดส่งงาน สถานะงานควรเปลี่ยนจาก `'in_progress'` เป็น `'submitted'`
- แต่จากภาพหน้าจอ สถานะยังเป็น "กำลังทำงาน"

**สาเหตุที่เป็นไปได้:**
1. **EscrowManagement.handleSubmitWork ไม่ได้เรียกใช้** - นักวาดอาจส่งงานผ่านหน้าอื่น
2. **มีหน้าอื่นที่ส่งงานแต่ไม่ได้อัปเดตสถานะ** - เช่น ArtistJobManagement
3. **งานถูกส่งก่อนที่เราจะแก้ไข** - งานเก่าที่ส่งไปแล้วจะยังมีสถานะเดิม

**วิธีแก้:**
ต้องตรวจสอบว่านักวาดส่งงานผ่านหน้าไหน และแก้ไขให้อัปเดตสถานะเป็น `'submitted'`

---

## 📋 สรุปไฟล์ที่แก้ไข

1. ✅ `src/pages/JobDetail.jsx`
   - แก้ไข `checkWorkSubmission` ให้ตรวจสอบงานที่ส่งมาทั้งหมด (ยกเว้น rejected)

2. ✅ `src/pages/ClientJobReview.jsx`
   - แก้ไขการตรวจสอบสิทธิ์ให้รองรับทั้ง `userId` และ `clientId`

---

## 🔍 ขั้นตอนการตรวจสอบเพิ่มเติม

### ต้องหาว่านักวาดส่งงานผ่านหน้าไหน:
1. ✅ **EscrowManagement** (`/escrow`) - แก้ไขแล้ว
2. ❓ **ArtistJobManagement** (`/artist-jobs`) - ต้องตรวจสอบ
3. ❓ หน้าอื่นๆ ที่อาจมีการส่งงาน

### วิธีตรวจสอบ:
```bash
# ค้นหาไฟล์ที่มีการอัปโหลดงาน
grep -r "workSubmissions" src/pages/
grep -r "submitWork" src/pages/
grep -r "ส่งงาน" src/pages/
```

---

## 📝 หมายเหตุ

- การแก้ไขครั้งนี้จะช่วยให้ปุ่ม "ตรวจสอบงาน" ทำงานได้ถูกต้อง
- แต่ยังต้องแก้ไขให้สถานะงานเปลี่ยนเป็น `'submitted'` เมื่อนักวาดส่งงาน
- หากนักวาดส่งงานผ่านหน้าอื่นที่ไม่ใช่ EscrowManagement ต้องแก้ไขหน้านั้นด้วย
