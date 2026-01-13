// Vercel Function: Delete Story with Chapters
// API: /api/delete-story
// ลบนิยายพร้อม chapters ทั้งหมดโดยใช้ Firebase Admin SDK

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // ตั้งค่า CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ตรวจสอบว่าเป็น POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ดึง storyId และ idToken จาก request body
    const { storyId, idToken } = req.body;

    if (!storyId || !idToken) {
      return res.status(400).json({ 
        error: 'Missing required fields: storyId and idToken' 
      });
    }

    // ตรวจสอบ Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const userId = decodedToken.uid;

    // ดึงข้อมูล user เพื่อตรวจสอบ role
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const isAdmin = userData.role === 'admin';

    // ดึงข้อมูล story เพื่อตรวจสอบ ownership
    const storyDoc = await db.collection('stories').doc(storyId).get();
    
    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const storyData = storyDoc.data();
    const isOwner = storyData.userId === userId || storyData.authorId === userId;

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของหรือแอดมิน
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: 'Permission denied: You must be the owner or admin to delete this story' 
      });
    }

    // ลบ chapters ทั้งหมดโดยใช้ batch (รวดเร็ว)
    const chaptersRef = db.collection('stories').doc(storyId).collection('chapters');
    const chaptersSnapshot = await chaptersRef.get();

    // ใช้ batch delete สำหรับ chapters (Admin SDK ไม่ต้องผ่าน security rules)
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    chaptersSnapshot.docs.forEach((doc) => {
      currentBatch.delete(doc.ref);
      operationCount++;

      // ถ้าถึง limit ให้สร้าง batch ใหม่
      if (operationCount === batchSize) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        operationCount = 0;
      }
    });

    // Commit batch สุดท้าย
    if (operationCount > 0) {
      batches.push(currentBatch.commit());
    }

    // รอให้ทุก batch เสร็จ
    await Promise.all(batches);

    // ลบ story document
    await db.collection('stories').doc(storyId).delete();

    // ส่งผลลัพธ์กลับ
    return res.status(200).json({
      success: true,
      message: 'Story and all chapters deleted successfully',
      deletedChapters: chaptersSnapshot.size,
      storyId: storyId,
    });

  } catch (error) {
    console.error('Error deleting story:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
