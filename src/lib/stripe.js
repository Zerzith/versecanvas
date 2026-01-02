import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key
let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Stripe payment configuration
export const stripeConfig = {
  currency: 'thb', // Thai Baht
  country: 'TH',
  locale: 'th',
};

// Credit packages with Stripe prices
export const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 10,
    priceInCents: 1000, // 10 THB in cents (TEST MODE)
    description: 'เหมาะสำหรับผู้เริ่มต้น',
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 500,
    price: 45,
    priceInCents: 4500, // 45 THB in cents (TEST MODE)
    description: 'ประหยัด 10% - แพ็คเกจยอดนิยม',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 1000,
    price: 85,
    priceInCents: 8500, // 85 THB in cents (TEST MODE)
    description: 'ประหยัด 15% - คุ้มค่าที่สุด',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 5000,
    price: 400,
    priceInCents: 40000, // 400 THB in cents (TEST MODE)
    description: 'ประหยัด 20% - สำหรับมืออาชีพ',
    popular: false,
  },
];

// Format price for display
export const formatPrice = (price, currency = 'THB') => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);
};

// Convert cents to currency
export const centsToPrice = (cents) => {
  return cents / 100;
};

// Convert currency to cents
export const priceToCents = (price) => {
  return Math.round(price * 100);
};
