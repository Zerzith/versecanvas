import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] border-t border-[#2a2a2a] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            เว็บไซต์นี้สร้างมาเพื่อทำโครงงาน วิทยาลัยเทคนิควังน้ำเย็น.
          </p>
          <p className="text-gray-500 text-xs mt-2 flex items-center justify-center space-x-1">
            <span>Made with</span>
            <span>for creators</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
