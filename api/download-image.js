// Vercel Serverless Function
// API: /api/download-image
// Proxy สำหรับดาวน์โหลดรูปภาพจาก Cloudinary (แก้ปัญหา CORS)

const https = require('https');
const http = require('http');

module.exports = async (req, res) => {
  // ตั้งค่า CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ตรวจสอบว่าเป็น GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // ตรวจสอบว่าเป็น URL ที่อนุญาต (Cloudinary หรือ Firebase Storage)
    const allowedDomains = [
      'res.cloudinary.com',
      'cloudinary.com',
      'firebasestorage.googleapis.com',
      'storage.googleapis.com'
    ];

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));

    if (!isAllowed) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    // เลือก protocol
    const protocol = urlObj.protocol === 'https:' ? https : http;

    // ดาวน์โหลดไฟล์
    const downloadPromise = new Promise((resolve, reject) => {
      protocol.get(url, (response) => {
        // ตรวจสอบ redirect
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Follow redirect
          protocol.get(response.headers.location, (redirectResponse) => {
            resolve(redirectResponse);
          }).on('error', reject);
        } else {
          resolve(response);
        }
      }).on('error', reject);
    });

    const response = await downloadPromise;

    if (response.statusCode !== 200) {
      return res.status(response.statusCode).json({ 
        error: `Failed to download: ${response.statusMessage}` 
      });
    }

    // ตั้งค่า headers สำหรับดาวน์โหลด
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    
    // กำหนดชื่อไฟล์
    const downloadFilename = filename || getFilenameFromUrl(url) || 'download';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Stream ข้อมูลไปยัง response
    response.pipe(res);

  } catch (error) {
    console.error('Error downloading image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to download image' 
    });
  }
};

// Helper function เพื่อดึงชื่อไฟล์จาก URL
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    
    // ลบ query string ออก
    const filename = lastPart.split('?')[0];
    
    // ถ้าไม่มีนามสกุล ให้เพิ่ม .jpg
    if (!filename.includes('.')) {
      return filename + '.jpg';
    }
    
    return filename;
  } catch {
    return 'download.jpg';
  }
}
