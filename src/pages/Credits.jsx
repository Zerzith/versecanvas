import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { Coins, Wallet, TrendingUp, MessageCircle, Mail, Phone, Plus, CreditCard, ArrowLeft, ArrowDownToLine } from 'lucide-react';
import { creditPackages, formatPrice } from '../lib/stripe';
import { createPaymentIntent, handleSuccessfulPayment, waitForWebhookProcessing } from '../lib/stripeApi';
import StripePayment, { PaymentSuccess, PaymentError } from '../components/StripePayment';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Link } from 'react-router-dom';

export default function Credits() {
  const { currentUser } = useAuth();
  const { credits, addCredits } = useCredit();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', null
  const [paymentError, setPaymentError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPackage = async (pkg) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนเติมเครดิต');
      return;
    }

    setSelectedPackage(pkg);
    setIsLoading(true);

    try {
      // Create payment intent
      const paymentData = await createPaymentIntent(
        pkg.price,
        'thb',
        {
          userId: currentUser.uid,
          packageId: pkg.id,
          packageName: pkg.name,
          credits: pkg.credits.toString(),
        }
      );

      setClientSecret(paymentData.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('เกิดข้อผิดพลาดในการสร้างการชำระเงิน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Record payment
      await handleSuccessfulPayment(currentUser.uid, paymentIntent, selectedPackage);
      
      // Wait for webhook to process payment and add credits
      console.log('Waiting for webhook to process payment...');
      const processed = await waitForWebhookProcessing(paymentIntent.id);
      
      if (processed) {
        console.log('Payment processed by webhook');
        setPaymentStatus('success');
      } else {
        console.log('Webhook processing timeout, but payment succeeded');
        // Payment succeeded but webhook might be delayed
        // Credits will be added when webhook processes
        setPaymentStatus('success');
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      setPaymentStatus('error');
      setPaymentError('การชำระเงินสำเร็จ แต่เกิดข้อผิดพลาดในการเพิ่มเครดิต กรุณารอสักครู่หรือติดต่อแอดมิน');
    }
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('error');
    setPaymentError(error?.message || 'เกิดข้อผิดพลาดในการชำระเงิน');
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setSelectedPackage(null);
    setClientSecret('');
    setPaymentStatus(null);
    setPaymentError('');
  };

  const handleRetryPayment = () => {
    setPaymentStatus(null);
    setPaymentError('');
    if (selectedPackage) {
      handleSelectPackage(selectedPackage);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            เติมเครดิต
          </h1>
          <p className="text-gray-400 text-lg">ซื้อเครดิตเพื่อใช้งานบนแพลตฟอร์ม</p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 mb-12 text-center relative">
          <Link 
            to="/withdraw"
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <ArrowDownToLine size={18} />
            ถอนเงิน
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Wallet className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">ยอดเครดิตปัจจุบัน</h2>
          </div>
          <div className="text-6xl font-bold text-white mb-2">
            {credits.toLocaleString()}
          </div>
          <p className="text-white/80">เครดิต</p>
        </div>

        {/* Payment Method Notice */}
        <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">ชำระเงินด้วย Stripe</h3>
              <p className="text-gray-300 mb-4">
                รองรับการชำระเงินด้วยบัตรเครดิต/เดบิต ผ่านระบบ Stripe ที่ปลอดภัยและเชื่อถือได้
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Visa</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Mastercard</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs">JCB</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs">American Express</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Payment */}
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">ช่องทางอื่นๆ</h3>
              <p className="text-gray-400 mb-4">
                หากต้องการชำระเงินผ่านช่องทางอื่น กรุณาติดต่อแอดมิน
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Email: admin@versecanvas.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Line: @versecanvas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            แพ็คเกจเครดิต
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-[#1a1a1a] rounded-2xl p-6 border-2 transition-all hover:scale-105 cursor-pointer ${
                  pkg.popular
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                    : 'border-[#2a2a2a] hover:border-yellow-500/50'
                }`}
                onClick={() => handleSelectPackage(pkg)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1 rounded-full text-xs font-bold text-white">
                      แนะนำ
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Coins className="w-12 h-12 text-yellow-500" />
                  </div>

                  <div className="text-4xl font-bold text-yellow-500 mb-2">
                    {pkg.credits.toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-sm mb-4">เครดิต</p>

                  {pkg.description && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-2 mb-4">
                      <span className="text-sm font-bold text-green-400">{pkg.description}</span>
                    </div>
                  )}

                  <div className="text-3xl font-bold text-white mb-4">
                    {formatPrice(pkg.price)}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    disabled={isLoading}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    ซื้อเลย
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a]">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-yellow-500" />
            ประโยชน์ของเครดิต
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Coins className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold mb-2">ซื้อสินค้าและบริการ</h3>
                <p className="text-gray-400 text-sm">
                  ใช้เครดิตซื้อสินค้าดิจิทัลและบริการต่างๆ ในแพลตฟอร์ม
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold mb-2">จ้างงาน Commission</h3>
                <p className="text-gray-400 text-sm">
                  ใช้เครดิตจ้างศิลปินสร้างงานตามที่คุณต้องการ
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h3 className="font-bold mb-2">โปรโมทผลงาน</h3>
                <p className="text-gray-400 text-sm">
                  ใช้เครดิตโปรโมทผลงานของคุณให้คนเห็นมากขึ้น
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={handleClosePayment}>
        <DialogContent className="max-w-md">
          {paymentStatus === 'success' ? (
            <PaymentSuccess
              amount={selectedPackage?.price}
              credits={selectedPackage?.credits}
              onClose={handleClosePayment}
            />
          ) : paymentStatus === 'error' ? (
            <PaymentError
              error={paymentError}
              onRetry={handleRetryPayment}
              onClose={handleClosePayment}
            />
          ) : (
            <>
              <DialogHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePayment}
                  className="absolute left-4 top-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </DialogHeader>
              <StripePayment
                clientSecret={clientSecret}
                amount={selectedPackage?.price}
                packageName={selectedPackage?.name}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
