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
    price: 100,
    priceInCents: 10000, // 100 THB in cents
    description: 'เหมาะสำหรับผู้เริ่มต้น',
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 500,
    price: 450,
    priceInCents: 45000, // 450 THB in cents
    description: 'ประหยัด 10%',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 1000,
    price: 850,
    priceInCents: 85000, // 850 THB in cents
    description: 'ประหยัด 15%',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 5000,
    price: 4000,
    priceInCents: 400000, // 4000 THB in cents
    description: 'ประหยัด 20%',
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
