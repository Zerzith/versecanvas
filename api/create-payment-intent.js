// Vercel Serverless Function
// API: /api/create-payment-intent
// สร้าง PaymentIntent สำหรับการชำระเงิน

const Stripe = require('stripe');

module.exports = async (req, res) => {
  // ตั้งค่า CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
    // ตรวจสอบ Stripe Secret Key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('MISSING_STRIPE_SECRET_KEY: Please set it in Vercel Environment Variables');
      return res.status(500).json({ 
        error: 'STRIPE_SECRET_KEY is missing in server environment',
        help: 'Please add STRIPE_SECRET_KEY to Vercel Settings > Environment Variables and Redeploy.'
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount, currency = 'thb', metadata = {} } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // สร้าง PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // แปลงเป็น satang/cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // ส่งกลับ client secret
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error('STRIPE_API_ERROR:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment intent',
      type: error.type || 'StripeError',
      code: error.code || 'unknown'
    });
  }
};
