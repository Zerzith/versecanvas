/**
 * Utility functions สำหรับดาวน์โหลดไฟล์
 */

// Get API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * ดาวน์โหลดรูปภาพจาก URL
 * @param {string} imageUrl - URL ของรูปภาพ
 * @param {string} filename - ชื่อไฟล์ที่ต้องการบันทึก
 * @returns {Promise<boolean>} - true ถ้าดาวน์โหลดสำเร็จ
 */
export async function downloadImage(imageUrl, filename = 'download') {
  if (!imageUrl) {
    throw new Error('URL is required');
  }

  try {
    // วิธีที่ 1: ลองดาวน์โหลดโดยตรงก่อน (สำหรับ Cloudinary ที่รองรับ CORS)
    const directDownload = await tryDirectDownload(imageUrl, filename);
    if (directDownload) return true;

    // วิธีที่ 2: ใช้ proxy API
    const proxyDownload = await tryProxyDownload(imageUrl, filename);
    if (proxyDownload) return true;

    // วิธีที่ 3: เปิดในแท็บใหม่
    window.open(imageUrl, '_blank');
    return true;

  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * ลองดาวน์โหลดโดยตรง
 */
async function tryDirectDownload(imageUrl, filename) {
  try {
    // สำหรับ Cloudinary ให้เพิ่ม fl_attachment
    let downloadUrl = imageUrl;
    if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
      downloadUrl = imageUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    const response = await fetch(downloadUrl, {
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      return false;
    }

    const blob = await response.blob();
    triggerDownload(blob, filename);
    return true;

  } catch (error) {
    console.log('Direct download failed, trying proxy...', error);
    return false;
  }
}

/**
 * ดาวน์โหลดผ่าน proxy API
 */
async function tryProxyDownload(imageUrl, filename) {
  try {
    const proxyUrl = `${API_BASE_URL}/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      return false;
    }

    const blob = await response.blob();
    triggerDownload(blob, filename);
    return true;

  } catch (error) {
    console.log('Proxy download failed:', error);
    return false;
  }
}

/**
 * สร้าง download link และคลิก
 */
function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * ดึงนามสกุลไฟล์จาก URL
 */
export function getFileExtension(url) {
  if (!url) return 'jpg';
  
  // ตรวจสอบจาก URL
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match) return match[1].toLowerCase();
  
  // ตรวจสอบจาก Cloudinary format
  if (url.includes('f_png')) return 'png';
  if (url.includes('f_webp')) return 'webp';
  if (url.includes('f_gif')) return 'gif';
  
  return 'jpg';
}

/**
 * สร้างชื่อไฟล์สำหรับดาวน์โหลด
 */
export function generateFilename(baseName, extension = 'jpg') {
  // ลบอักขระพิเศษ
  const safeName = baseName.replace(/[^a-zA-Z0-9ก-๙\s]/g, '').trim();
  // เพิ่ม timestamp
  const timestamp = Date.now();
  return `${safeName}_${timestamp}.${extension}`;
}

/**
 * แปลง Cloudinary URL ให้เป็นแบบดาวน์โหลดได้
 */
export function getCloudinaryDownloadUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // เพิ่ม fl_attachment transformation
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  
  return url;
}

/**
 * ดึง URL รูปภาพขนาดเต็มจาก Cloudinary
 */
export function getCloudinaryFullSizeUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // ลบ transformation ออก
  if (url.includes('/upload/')) {
    return url.replace(/\/upload\/[^/]+\//, '/upload/');
  }
  
  return url;
}

export default {
  downloadImage,
  getFileExtension,
  generateFilename,
  getCloudinaryDownloadUrl,
  getCloudinaryFullSizeUrl
};
