/**
 * เพิ่มลายน้ำให้กับภาพ
 * @param {File} imageFile - ไฟล์ภาพต้นฉบับ
 * @param {string} watermarkText - ข้อความลายน้ำ (เช่น "PREVIEW" หรือชื่อผู้ใช้)
 * @returns {Promise<Blob>} - ภาพที่มีลายน้ำ
 */
export async function addWatermark(imageFile, watermarkText = 'PREVIEW') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // สร้าง canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // ตั้งขนาด canvas ให้เท่ากับภาพ
        canvas.width = img.width;
        canvas.height = img.height;
        
        // วาดภาพต้นฉบับ
        ctx.drawImage(img, 0, 0);
        
        // ตั้งค่าลายน้ำ
        const fontSize = Math.floor(img.width / 10); // ขนาดตัวอักษรตามขนาดภาพ
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // สีขาวโปร่งแสง
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // ขอบดำโปร่งแสง
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // หมุน canvas เพื่อวาดลายน้ำแนวทแยง
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); // หมุน -30 องศา
        
        // วาดลายน้ำหลายตำแหน่ง
        const spacing = fontSize * 3;
        for (let y = -canvas.height; y < canvas.height; y += spacing) {
          for (let x = -canvas.width; x < canvas.width; x += spacing) {
            ctx.strokeText(watermarkText, x, y);
            ctx.fillText(watermarkText, x, y);
          }
        }
        
        ctx.restore();
        
        // แปลง canvas เป็น Blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('ไม่สามารถสร้างภาพที่มีลายน้ำได้'));
          }
        }, imageFile.type || 'image/jpeg', 0.95);
      };
      
      img.onerror = () => {
        reject(new Error('ไม่สามารถโหลดภาพได้'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * อัปโหลดภาพที่มีลายน้ำไปยัง Cloudinary
 * @param {Blob} watermarkedBlob - ภาพที่มีลายน้ำ
 * @returns {Promise<string>} - URL ของภาพที่อัปโหลด
 */
export async function uploadWatermarkedImage(watermarkedBlob) {
  const formData = new FormData();
  formData.append('file', watermarkedBlob);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  const data = await response.json();
  
  if (data.secure_url) {
    return data.secure_url;
  } else {
    throw new Error('ไม่สามารถอัปโหลดภาพได้');
  }
}

/**
 * สร้างภาพพร้อมลายน้ำและอัปโหลด
 * @param {File} imageFile - ไฟล์ภาพต้นฉบับ
 * @param {string} watermarkText - ข้อความลายน้ำ
 * @returns {Promise<{originalUrl: string, watermarkedUrl: string}>}
 */
export async function processAndUploadImages(imageFile, watermarkText = 'PREVIEW') {
  try {
    // อัปโหลดภาพต้นฉบับ
    const originalFormData = new FormData();
    originalFormData.append('file', imageFile);
    originalFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    
    const originalResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: originalFormData
      }
    );
    
    const originalData = await originalResponse.json();
    
    if (!originalData.secure_url) {
      throw new Error('ไม่สามารถอัปโหลดภาพต้นฉบับได้');
    }
    
    // สร้างภาพที่มีลายน้ำ
    const watermarkedBlob = await addWatermark(imageFile, watermarkText);
    
    // อัปโหลดภาพที่มีลายน้ำ
    const watermarkedUrl = await uploadWatermarkedImage(watermarkedBlob);
    
    return {
      originalUrl: originalData.secure_url,
      watermarkedUrl: watermarkedUrl
    };
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
}
