// Vercel Serverless Function
// API: /api/webhook
// รับและประมวลผล Webhook Events จาก Stripe

const Stripe = require('stripe');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (ถ้ายังไม่ได้ initialize)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Config สำหรับ Vercel - ต้องรับ raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to get raw body
const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
};

module.exports = async (req, res) => {
  // ตรวจสอบว่าเป็น POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ตรวจสอบ environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    // Get raw body
    const rawBody = await getRawBody(req);

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Received event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // ส่งกลับ 200 เพื่อยืนยันว่าได้รับ webhook แล้ว
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: error.message || 'Webhook processing failed' 
    });
  }
};

// ฟังก์ชันจัดการเมื่อชำระเงินสำเร็จ
async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);

    const { userId, credits, packageName } = paymentIntent.metadata;

    if (!userId || !credits) {
      console.error('Missing metadata:', paymentIntent.metadata);
      return;
    }

    // อัปเดตเครดิตของผู้ใช้
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('User not found:', userId);
      return;
    }

    const currentCredits = userDoc.data().credits || 0;
    const newCredits = currentCredits + parseInt(credits);

    // อัปเดตเครดิต
    await userRef.update({
      credits: newCredits,
      updatedAt: new Date()
    });

    // บันทึกประวัติธุรกรรม
    await db.collection('transactions').add({
      userId,
      type: 'credit_purchase',
      amount: parseInt(credits),
      previousBalance: currentCredits,
      newBalance: newCredits,
      paymentIntentId: paymentIntent.id,
      paymentMethod: 'stripe',
      packageName: packageName || 'Unknown',
      status: 'completed',
      createdAt: new Date()
    });

    // สร้างการแจ้งเตือน
    await db.collection('notifications').add({
      userId,
      type: 'credit_added',
      title: 'เติมเครดิตสำเร็จ',
      message: `คุณได้รับเครดิต ${credits} เครดิต จากการซื้อแพ็คเกจ ${packageName || 'Unknown'}`,
      read: false,
      createdAt: new Date()
    });

    console.log(`Added ${credits} credits to user ${userId}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

// ฟังก์ชันจัดการเมื่อชำระเงินล้มเหลว
async function handlePaymentFailed(paymentIntent) {
  try {
    console.log('Payment failed:', paymentIntent.id);

    const { userId } = paymentIntent.metadata;

    if (!userId) {
      return;
    }

    // สร้างการแจ้งเตือน
    await db.collection('notifications').add({
      userId,
      type: 'payment_failed',
      title: 'การชำระเงินล้มเหลว',
      message: 'การเติมเครดิตของคุณล้มเหลว กรุณาลองใหม่อีกครั้ง',
      read: false,
      createdAt: new Date()
    });

    console.log(`Payment failed notification sent to user ${userId}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// ฟังก์ชันจัดการเมื่อชำระเงินถูกยกเลิก
async function handlePaymentCanceled(paymentIntent) {
  try {
    console.log('Payment canceled:', paymentIntent.id);

    const { userId } = paymentIntent.metadata;

    if (!userId) {
      return;
    }

    // สร้างการแจ้งเตือน
    await db.collection('notifications').add({
      userId,
      type: 'payment_canceled',
      title: 'การชำระเงินถูกยกเลิก',
      message: 'การเติมเครดิตของคุณถูกยกเลิก',
      read: false,
      createdAt: new Date()
    });

    console.log(`Payment canceled notification sent to user ${userId}`);

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

// ฟังก์ชันจัดการเมื่อมีการคืนเงิน
async function handleRefund(charge) {
  try {
    console.log('Charge refunded:', charge.id);

    const paymentIntentId = charge.payment_intent;

    // ค้นหาธุรกรรมที่เกี่ยวข้อง
    const transactionSnapshot = await db.collection('transactions')
      .where('paymentIntentId', '==', paymentIntentId)
      .where('type', '==', 'credit_purchase')
      .limit(1)
      .get();

    if (transactionSnapshot.empty) {
      console.log('No transaction found for refund');
      return;
    }

    const transaction = transactionSnapshot.docs[0];
    const { userId, amount } = transaction.data();

    // หักเครดิตกลับ
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('User not found:', userId);
      return;
    }

    const currentCredits = userDoc.data().credits || 0;
    const newCredits = Math.max(0, currentCredits - amount);

    await userRef.update({
      credits: newCredits,
      updatedAt: new Date()
    });

    // บันทึกประวัติการคืนเงิน
    await db.collection('transactions').add({
      userId,
      type: 'refund',
      amount: -amount,
      previousBalance: currentCredits,
      newBalance: newCredits,
      chargeId: charge.id,
      paymentIntentId: paymentIntentId,
      status: 'completed',
      createdAt: new Date()
    });

    // สร้างการแจ้งเตือน
    await db.collection('notifications').add({
      userId,
      type: 'refund',
      title: 'คืนเงินสำเร็จ',
      message: `เครดิต ${amount} เครดิตถูกหักออกจากบัญชีของคุณเนื่องจากการคืนเงิน`,
      read: false,
      createdAt: new Date()
    });

    console.log(`Refunded ${amount} credits from user ${userId}`);

  } catch (error) {
    console.error('Error handling refund:', error);
  }
}
