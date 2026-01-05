import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { 
  Coins, Wallet, TrendingUp, MessageCircle, Mail, Phone, 
  Plus, CreditCard, ArrowLeft, ArrowDownToLine, Zap, Star, 
  Crown, Gem, History, Shield, CheckCircle2 
} from 'lucide-react';
import { creditPackages, formatPrice } from '../lib/stripe';
import { createPaymentIntent, handleSuccessfulPayment, waitForWebhookProcessing } from '../lib/stripeApi';
import StripePayment, { PaymentSuccess, PaymentError } from '../components/StripePayment';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function Credits() {
  const { currentUser } = useAuth();
  const { credits } = useCredit();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', null
  const [paymentError, setPaymentError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('buy'); // buy, history
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (currentUser && activeTab === 'history') {
      fetchTransactionHistory();
    }
  }, [currentUser, activeTab]);

  const fetchTransactionHistory = async () => {
    try {
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleSelectPackage = async (pkg) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนเติมเครดิต');
      return;
    }

    setSelectedPackage(pkg);
    setIsLoading(true);

    try {
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
      // Record payment in Firestore
      await handleSuccessfulPayment(currentUser.uid, paymentIntent, selectedPackage);
      
      // Show success immediately - credits will be added by webhook
      setPaymentStatus('success');
      
      // Optionally wait for webhook in background (don't block UI)
      waitForWebhookProcessing(paymentIntent.id).then((processed) => {
        if (processed) {
          console.log('Webhook processed successfully');
        } else {
          console.warn('Webhook processing timeout - credits may take a moment to appear');
        }
      });
    } catch (error) {
      console.error('Error handling payment success:', error);
      setPaymentStatus('error');
      setPaymentError('การชำระเงินสำเร็จ แต่เกิดข้อผิดพลาดในการบันทึก กรุณารีเฟรชหน้าเว็บ');
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
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              เติมเครดิต VerseCanvas
            </h1>
            <p className="text-gray-400">ใช้เครดิตเพื่อจ้างงานศิลปิน ซื้อผลงาน หรือสนับสนุนนักเขียนที่คุณชื่นชอบ</p>
          </div>
          
          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-purple-500/30 flex items-center gap-4 shadow-lg shadow-purple-500/10">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">เครดิตปัจจุบันของคุณ</p>
              <p className="text-3xl font-black text-purple-400">{credits.toLocaleString()} <span className="text-sm font-normal text-gray-500">เครดิต</span></p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('buy')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${activeTab === 'buy' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'}`}
          >
            เลือกแพ็คเกจ
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${activeTab === 'history' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'}`}
          >
            ประวัติการเติมเงิน
          </button>
        </div>

        {activeTab === 'buy' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.id}
                className={`relative flex flex-col bg-[#1a1a1a] rounded-3xl border-2 ${pkg.popular ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-[#2a2a2a]'} overflow-hidden transition-all duration-300 hover:scale-105`}
                onClick={() => handleSelectPackage(pkg)}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                    ยอดนิยม
                  </div>
                )}
                
                <div className="p-8 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                  <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center mb-4">
                    <Coins className="text-purple-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2 h-8">{pkg.description}</p>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-6">
                    <span className="text-4xl font-black">{pkg.credits.toLocaleString()}</span>
                    <span className="text-gray-400 ml-2">เครดิต</span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span>เติมเข้าบัญชีทันที</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span>ไม่มีวันหมดอายุ</span>
                    </div>
                  </div>

                  <Button 
                    className={`w-full py-6 rounded-2xl font-bold transition ${pkg.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'}`}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPackage?.id === pkg.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      formatPrice(pkg.price)
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#2a2a2a] overflow-hidden">
            {history.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#2a2a2a] bg-[#252525]">
                    <th className="px-6 py-4 text-sm font-bold text-gray-400">วันที่</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-400">รายการ</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-400">จำนวนเครดิต</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-400">ราคา</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-400">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-[#2a2a2a]/50 transition">
                      <td className="px-6 py-4 text-sm">
                        {new Date(item.createdAt?.seconds * 1000).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{item.packageName || 'เติมเครดิต'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-400">
                        +{item.credits?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        ฿{item.amount ? (item.amount / 100).toLocaleString() : '0'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase">
                          สำเร็จ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-gray-500">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p>ยังไม่มีประวัติการเติมเงิน</p>
              </div>
            )}
          </div>
        )}

        {/* Security Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-bold mb-1">ปลอดภัย 100%</h4>
              <p className="text-xs text-gray-400">ชำระเงินผ่านระบบ Stripe มาตรฐานระดับโลก</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="font-bold mb-1">รวดเร็วทันใจ</h4>
              <p className="text-xs text-gray-400">เครดิตจะถูกเติมเข้าบัญชีทันทีหลังจากชำระเงินสำเร็จ</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-bold mb-1">สนับสนุนศิลปิน</h4>
              <p className="text-xs text-gray-400">ทุกการเติมเงินช่วยขับเคลื่อนชุมชนศิลปิน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={handleClosePayment}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
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
                <DialogTitle className="text-center mb-4">ชำระเงินผ่าน Stripe</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePayment}
                  className="absolute left-4 top-4 text-gray-400 hover:text-white"
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
