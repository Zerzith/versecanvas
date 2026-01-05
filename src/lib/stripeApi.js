import { db } from './firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

// Get API base URL from environment variable
// On Vercel, we can use relative paths if the frontend and backend are on the same domain
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create Payment Intent
export async function createPaymentIntent(amount, currency = 'thb', metadata = {}) {
  try {
    // Use relative path if API_BASE_URL is not set
    const url = API_BASE_URL ? `${API_BASE_URL}/api/create-payment-intent` : '/api/create-payment-intent';
    
    // Call backend API to create payment intent
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create payment intent';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        const text = await response.text();
        console.error('Non-JSON response:', text);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error('Failed to parse JSON response:', text);
      throw new Error('Server returned invalid JSON response. Please check if the API is deployed correctly.');
    }
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      amount: data.amount,
      currency: data.currency
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Record payment in Firestore (for tracking purposes)
export async function recordPayment(userId, paymentData) {
  try {
    const paymentRef = await addDoc(collection(db, 'payments'), {
      userId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: paymentData.status,
      paymentIntentId: paymentData.paymentIntentId,
      packageId: paymentData.packageId,
      packageName: paymentData.packageName,
      credits: paymentData.credits,
      createdAt: serverTimestamp(),
    });

    return paymentRef.id;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}

// Get payment history
export async function getPaymentHistory(userId) {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef, 
      where('userId', '==', userId), 
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting payment history:', error);
    return [];
  }
}

// Handle successful payment
export async function handleSuccessfulPayment(userId, paymentIntent, packageData) {
  try {
    // Record payment in Firestore for tracking
    // Note: Credits are added by the webhook handler on the backend
    await recordPayment(userId, {
      amount: paymentIntent.amount / 100, // Convert from cents/satang
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      packageId: packageData.id,
      packageName: packageData.name,
      credits: packageData.credits,
    });

    return true;
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

// Check if payment was processed (for polling)
export async function checkPaymentStatus(paymentIntentId) {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef, 
      where('paymentIntentId', '==', paymentIntentId),
      where('status', '==', 'succeeded')
    );
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return false;
  }
}

// Wait for webhook to process payment (with timeout)
export async function waitForWebhookProcessing(paymentIntentId, maxAttempts = 10, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const processed = await checkPaymentStatus(paymentIntentId);
    if (processed) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}
