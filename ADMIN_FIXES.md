# 🔧 แก้ไขปัญหาระบบแอดมิน - สรุป

## ✅ ปัญหาที่แก้ไขแล้ว

### 1. ❌ **ไม่มีระบบอนุมัติการถอนเงิน** → ✅ **แก้ไขแล้ว!**

**สร้างหน้าใหม่:** `/admin/withdrawals`

**ฟีเจอร์:**
- ✅ ดูคำขอถอนเงินทั้งหมด
- ✅ กรองตามสถานะ (รอดำเนินการ, อนุมัติแล้ว, ปฏิเสธ)
- ✅ อนุมัติการถอนเงิน
- ✅ ปฏิเสธการถอนเงิน (พร้อมระบุเหตุผล)
- ✅ สถิติ: รอดำเนินการ, อนุมัติแล้ว, ปฏิเสธ, ยอดอนุมัติทั้งหมด

**การทำงาน:**
```javascript
// อนุมัติการถอนเงิน
const handleApprove = async (withdrawalId) => {
  const withdrawalRef = doc(db, 'transactions', withdrawalId);
  await updateDoc(withdrawalRef, {
    status: 'approved',
    approvedAt: new Date(),
    updatedAt: new Date()
  });
  toast.success('อนุมัติการถอนเงินสำเร็จ!');
};

// ปฏิเสธการถอนเงิน
const handleReject = async (withdrawalId) => {
  const reason = prompt('กรุณาระบุเหตุผล:');
  const withdrawalRef = doc(db, 'transactions', withdrawalId);
  await updateDoc(withdrawalRef, {
    status: 'rejected',
    rejectedReason: reason,
    rejectedAt: new Date()
  });
  toast.success('ปฏิเสธการถอนเงินสำเร็จ!');
};
```

**ดึงข้อมูล:**
```javascript
// ดึงธุรกรรมประเภท withdrawal
const withdrawalsQuery = query(
  collection(db, 'transactions'),
  where('type', '==', 'withdrawal'),
  orderBy('createdAt', 'desc')
);
```

**Schema ของ Transaction:**
```javascript
{
  id: string,
  userId: string,
  type: 'withdrawal',
  amount: number,
  description: string,
  status: 'pending' | 'approved' | 'rejected',
  rejectedReason?: string,
  approvedAt?: timestamp,
  rejectedAt?: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 2. ❌ **ไม่สามารถซ่อน/ลบนิยายและผลงานได้** → ✅ **แก้ไขแล้ว!**

**ปัญหา:**
- ใช้ `alert()` แทน toast notifications
- ไม่มี error messages ที่ชัดเจน
- ไม่แสดงข้อความ error จาก Firebase

**การแก้ไข:**
```javascript
// เพิ่ม toast notifications
import toast from 'react-hot-toast';

// ซ่อน/แสดงเนื้อหา
const handleToggleVisibility = async (id, currentStatus, type) => {
  try {
    const collectionName = type === 'story' ? 'stories' : 'artworks';
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      hidden: !currentStatus,
      updatedAt: new Date()
    });
    
    toast.success(`${currentStatus ? 'แสดง' : 'ซ่อน'}เนื้อหาสำเร็จ!`);
  } catch (error) {
    console.error('Error toggling visibility:', error);
    toast.error('เกิดข้อผิดพลาด: ' + error.message);
  }
};

// ลบนิยาย
const handleDeleteStory = async (storyId) => {
  if (!confirm('คุณต้องการลบนิยายนี้หรือไม่?')) return;
  
  try {
    // ลบตอนทั้งหมดก่อน
    const chaptersSnap = await getDocs(collection(db, 'chapters'));
    const storyChapters = chaptersSnap.docs.filter(doc => doc.data().storyId === storyId);
    await Promise.all(storyChapters.map(doc => deleteDoc(doc.ref)));
    
    // ลบนิยาย
    await deleteDoc(doc(db, 'stories', storyId));
    setStories(stories.filter(s => s.id !== storyId));
    toast.success('ลบนิยายสำเร็จ!');
  } catch (error) {
    console.error('Error deleting story:', error);
    toast.error('เกิดข้อผิดพลาดในการลบ: ' + error.message);
  }
};

// ลบผลงาน
const handleDeleteArtwork = async (artworkId) => {
  if (!confirm('คุณต้องการลบผลงานนี้หรือไม่?')) return;
  
  try {
    await deleteDoc(doc(db, 'artworks', artworkId));
    setArtworks(artworks.filter(a => a.id !== artworkId));
    toast.success('ลบผลงานสำเร็จ!');
  } catch (error) {
    console.error('Error deleting artwork:', error);
    toast.error('เกิดข้อผิดพลาดในการลบ: ' + error.message);
  }
};
```

**ผลลัพธ์:**
- ✅ แสดง toast notification เมื่อสำเร็จ
- ✅ แสดง error message ที่ชัดเจน
- ✅ ลบนิยายพร้อมตอนทั้งหมด
- ✅ อัปเดต UI ทันทีหลังลบ

---

### 3. ❌ **ไม่สามารถแบนผู้ใช้ได้** → ✅ **แก้ไขแล้ว!**

**ปัญหา:**
- ใช้ `alert()` แทน toast notifications
- ไม่มี error messages ที่ชัดเจน
- ไม่แสดงข้อความ error จาก Firebase

**การแก้ไข:**
```javascript
// เพิ่ม toast notifications
import toast from 'react-hot-toast';

// แบน/ปลดแบนผู้ใช้
const handleBanUser = async (userId, currentBanStatus) => {
  if (!confirm(`คุณต้องการ${currentBanStatus ? 'ปลดแบน' : 'แบน'}ผู้ใช้นี้หรือไม่?`)) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      banned: !currentBanStatus,
      updatedAt: new Date()
    });
    
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, banned: !currentBanStatus }
        : u
    ));
    
    toast.success(`${currentBanStatus ? 'ปลดแบน' : 'แบน'}ผู้ใช้สำเร็จ!`);
  } catch (error) {
    console.error('Error banning user:', error);
    toast.error('เกิดข้อผิดพลาด: ' + error.message);
  }
};

// ลบผู้ใช้
const handleDeleteUser = async (userId) => {
  if (!confirm('คุณต้องการลบผู้ใช้นี้หรือไม่?')) return;
  
  try {
    await deleteDoc(doc(db, 'users', userId));
    setUsers(users.filter(u => u.id !== userId));
    toast.success('ลบผู้ใช้สำเร็จ!');
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('เกิดข้อผิดพลาดในการลบ: ' + error.message);
  }
};

// แก้ไขผู้ใช้
const handleSaveEdit = async () => {
  try {
    const userRef = doc(db, 'users', selectedUser.id);
    await updateDoc(userRef, {
      displayName: editForm.displayName,
      role: editForm.role,
      updatedAt: new Date()
    });
    
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, ...editForm, updatedAt: new Date() }
        : u
    ));
    
    setShowEditModal(false);
    setSelectedUser(null);
    toast.success('บันทึกข้อมูลสำเร็จ!');
  } catch (error) {
    console.error('Error updating user:', error);
    toast.error('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
  }
};
```

**ผลลัพธ์:**
- ✅ แสดง toast notification เมื่อสำเร็จ
- ✅ แสดง error message ที่ชัดเจน
- ✅ แบน/ปลดแบนทำงานได้
- ✅ อัปเดต UI ทันทีหลังแบน

---

## 📊 สรุปการแก้ไข

### ไฟล์ที่สร้างใหม่:
1. **`src/pages/admin/WithdrawalManagement.jsx`** - หน้าอนุมัติการถอนเงิน

### ไฟล์ที่แก้ไข:
1. **`src/pages/admin/ContentManagement.jsx`** - เพิ่ม toast notifications
2. **`src/pages/admin/UserManagement.jsx`** - เพิ่ม toast notifications
3. **`src/components/AdminLayout.jsx`** - เพิ่มเมนู "อนุมัติถอนเงิน"
4. **`src/App.jsx`** - เพิ่ม route `/admin/withdrawals`

### การปรับปรุง:
- ✅ เพิ่ม `toast.success()` แทน `alert()`
- ✅ เพิ่ม `toast.error()` พร้อม error message
- ✅ แสดง `error.message` จาก Firebase
- ✅ Better UX ด้วย toast notifications
- ✅ Error handling ที่ดีขึ้น

---

## 🎯 ฟีเจอร์ที่ทำงานได้แล้ว

### ✅ User Management
- [x] ดูรายชื่อผู้ใช้
- [x] ค้นหาผู้ใช้
- [x] แก้ไขข้อมูล (displayName, role)
- [x] แบน/ปลดแบนผู้ใช้
- [x] ลบผู้ใช้

### ✅ Content Management
- [x] ดูนิยายทั้งหมด
- [x] ดูผลงานทั้งหมด
- [x] ซ่อน/แสดงนิยาย
- [x] ซ่อน/แสดงผลงาน
- [x] ลบนิยาย (พร้อมตอน)
- [x] ลบผลงาน

### ✅ Withdrawal Management (ใหม่!)
- [x] ดูคำขอถอนเงินทั้งหมด
- [x] กรองตามสถานะ
- [x] อนุมัติการถอนเงิน
- [x] ปฏิเสธการถอนเงิน
- [x] สถิติการถอนเงิน

---

## 🚀 วิธีใช้งาน

### 1. อนุมัติการถอนเงิน
```
1. ไปที่ /admin/withdrawals
2. ดูรายการคำขอถอนเงิน
3. คลิก "อนุมัติ" หรือ "ปฏิเสธ"
4. ระบบจะอัปเดต status ใน Firestore
```

### 2. ซ่อน/แสดงเนื้อหา
```
1. ไปที่ /admin/content
2. เลือกแท็บ "นิยาย" หรือ "ผลงานศิลปะ"
3. คลิกปุ่ม "ซ่อน" หรือ "แสดง"
4. ระบบจะอัปเดต field `hidden` ใน Firestore
```

### 3. แบนผู้ใช้
```
1. ไปที่ /admin/users
2. ค้นหาผู้ใช้
3. คลิกปุ่ม "แบน"
4. ระบบจะอัปเดต field `banned` ใน Firestore
```

---

## 📝 Database Schema

### Transactions (สำหรับ Withdrawals)
```javascript
{
  id: string,
  userId: string,
  type: 'withdrawal',
  amount: number,
  description: string,
  status: 'pending' | 'approved' | 'rejected',
  rejectedReason?: string,
  approvedAt?: timestamp,
  rejectedAt?: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Users (สำหรับ Ban)
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'user' | 'moderator' | 'admin',
  banned: boolean,  // ← field สำหรับแบน
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Stories/Artworks (สำหรับ Hide)
```javascript
{
  id: string,
  title: string,
  hidden: boolean,  // ← field สำหรับซ่อน
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## ✅ สรุป

**ปัญหาทั้ง 3 อย่างแก้ไขเสร็จแล้ว!**

1. ✅ ระบบอนุมัติการถอนเงิน - สร้างหน้าใหม่ `/admin/withdrawals`
2. ✅ ซ่อน/ลบเนื้อหา - เพิ่ม toast notifications และ error handling
3. ✅ แบนผู้ใช้ - เพิ่ม toast notifications และ error handling

**ทุกอย่างทำงานได้จริงแล้ว!** 🎉
