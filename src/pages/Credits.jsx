import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { Coins, Wallet, TrendingUp, MessageCircle, Mail, Phone, Plus } from 'lucide-react';

export default function Credits() {
  const { currentUser } = useAuth();
  const { credits } = useCredit();

  const packages = [
    { id: 1, amount: 100, price: 100, bonus: 0, popular: false },
    { id: 2, amount: 500, price: 450, bonus: 50, popular: true },
    { id: 3, amount: 1000, price: 850, bonus: 150, popular: false },
    { id: 4, amount: 2000, price: 1600, bonus: 400, popular: false },
    { id: 5, amount: 5000, price: 3750, bonus: 1250, popular: false },
  ];

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
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Wallet className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">ยอดเครดิตปัจจุบัน</h2>
          </div>
          <div className="text-6xl font-bold text-white mb-2">
            {credits.toLocaleString()}
          </div>
          <p className="text-white/80">เครดิต</p>
        </div>

        {/* Notice */}
        <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">ติดต่อแอดมินเพื่อเติมเครดิต</h3>
              <p className="text-gray-300 mb-4">
                ขณะนี้ระบบชำระเงินอัตโนมัติยังไม่พร้อมใช้งาน กรุณาติดต่อแอดมินเพื่อทำการเติมเครดิต
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Email: admin@versecanvas.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-400" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-[#1a1a1a] rounded-2xl p-6 border-2 transition-all ${
                  pkg.popular
                    ? 'border-yellow-500 transform scale-105'
                    : 'border-[#2a2a2a]'
                }`}
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
                    {pkg.amount.toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-sm mb-4">เครดิต</p>

                  {pkg.bonus > 0 && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-2 mb-4">
                      <div className="flex items-center justify-center gap-1 text-green-400">
                        <Plus size={14} />
                        <span className="text-sm font-bold">{pkg.bonus} โบนัส</span>
                      </div>
                    </div>
                  )}

                  <div className="text-3xl font-bold text-white mb-4">
                    ฿{pkg.price.toLocaleString()}
                  </div>

                  <div className="text-sm text-gray-400 italic">
                    ติดต่อแอดมินเพื่อซื้อ
                  </div>
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
    </div>
  );
}
