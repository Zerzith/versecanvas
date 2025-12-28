import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripe';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';

// Payment Form Component
function PaymentForm({ amount, onSuccess, onError, packageName }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/credits?success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        onError?.(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">แพ็คเกจ</p>
            <p className="font-semibold">{packageName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">ยอดชำระ</p>
            <p className="text-2xl font-bold">฿{amount}</p>
          </div>
        </div>

        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            กำลังดำเนินการ...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            ชำระเงิน ฿{amount}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        การชำระเงินของคุณปลอดภัยและเข้ารหัสด้วย Stripe
      </p>
    </form>
  );
}

// Main Stripe Payment Component
export default function StripePayment({ 
  clientSecret, 
  amount, 
  packageName,
  onSuccess, 
  onError 
}) {
  const stripePromise = getStripe();

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0070f3',
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    locale: 'th',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          ชำระเงิน
        </CardTitle>
        <CardDescription>
          กรอกข้อมูลบัตรเครดิต/เดบิตเพื่อเติมเครดิต
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm 
            amount={amount} 
            packageName={packageName}
            onSuccess={onSuccess} 
            onError={onError} 
          />
        </Elements>
      </CardContent>
    </Card>
  );
}

// Success Message Component
export function PaymentSuccess({ amount, credits, onClose }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-600">ชำระเงินสำเร็จ!</h3>
            <p className="text-muted-foreground mt-2">
              คุณได้รับเครดิต {credits} เครดิต
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">ยอดชำระ</p>
            <p className="text-3xl font-bold">฿{amount}</p>
          </div>
          <Button onClick={onClose} className="w-full" size="lg">
            เสร็จสิ้น
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Error Message Component
export function PaymentError({ error, onRetry, onClose }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด</h3>
            <p className="text-muted-foreground mt-2">
              {error || 'ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่อีกครั้ง'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onRetry} variant="outline" className="flex-1">
              ลองอีกครั้ง
            </Button>
            <Button onClick={onClose} className="flex-1">
              ปิด
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
