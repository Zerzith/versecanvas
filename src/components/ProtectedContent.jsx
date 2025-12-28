import { useEffect } from 'react';

export default function ProtectedContent({ children }) {
  useEffect(() => {
    // ป้องกันคลิกขวา
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // ป้องกันการลากรูป
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // ป้องกัน keyboard shortcuts
    const handleKeyDown = (e) => {
      // Ctrl+S, Ctrl+C, Ctrl+P, F12, Ctrl+Shift+I
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'c' || e.key === 'p')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // ป้องกัน Print Screen (แสดงเตือน)
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        alert('การแคปหน้าจอถูกปิดใช้งาน');
      }
    };

    // ป้องกันการ select text
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    // เพิ่ม event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('selectstart', handleSelectStart);

    // CSS เพิ่มเติม
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    return () => {
      // ลบ event listeners เมื่อ component unmount
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectstart', handleSelectStart);

      // คืนค่า CSS
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, []);

  return <div className="protected-content">{children}</div>;
}

// Component สำหรับแสดงรูปที่มี watermark
export function ProtectedImage({ src, alt, watermarkText = 'PREVIEW', className = '' }) {
  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={alt}
        className={`${className} select-none pointer-events-none`}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Watermark Overlay */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="text-white/30 font-bold text-6xl transform rotate-[-45deg] select-none"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.2em'
            }}
          >
            {watermarkText}
          </div>
        </div>
      </div>
    </div>
  );
}
