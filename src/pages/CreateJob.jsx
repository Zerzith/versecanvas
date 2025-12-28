import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Gem, Clock, User, FileText, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateJob = () => {
  const { currentUser, language } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'artsign',
    budgetMin: '',
    budgetMax: '',
    duration: '',
    slots: true,
    type: '',
    description: '',
    reference: ''
  });

  const translations = {
    th: {
      title: 'ตามหานักวาด',
      subtitle: 'โพสต์งานศิลปะหรือคอมมิชชั่นของคุณ',
      jobTitle: 'ชื่องาน',
      jobTitlePlaceholder: 'เช่น ตามหานักวาด Artsign',
      category: 'ประเภทงาน',
      artsign: 'Artsign',
      commission: 'คอมมิชชั่น',
      custom: 'งานพิเศษ',
      budget: 'งบประมาณ',
      budgetMin: 'ขั้นต่ำ',
      budgetMax: 'สูงสุด (ไม่บังคับ)',
      duration: 'ระยะเวลา (วัน)',
      durationPlaceholder: 'เช่น 30',
      slots: 'ประเภทการใช้งาน',
      private: 'ใช้ส่วนบุคคล',
      public: 'เปิดช่องว่าง',
      type: 'ประเภทงาน',
      typePlaceholder: 'เช่น ภาพโปรไฟล์, ใช้ส่วนบุคคล',
      description: 'รายละเอียด',
      descriptionPlaceholder: 'อธิบายรายละเอียดงานที่ต้องการ...',
      reference: 'ลิงก์อ้างอิง (ไม่บังคับ)',
      referencePlaceholder: 'https://...',
      cancel: 'ยกเลิก',
      submit: 'โพสต์งาน',
      loginRequired: 'กรุณาเข้าสู่ระบบเพื่อโพสต์งาน',
      success: 'โพสต์งานสำเร็จ!',
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    },
    en: {
      title: 'Post a Job',
      subtitle: 'Post your art job or commission',
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'e.g. Looking for Artsign Artist',
      category: 'Category',
      artsign: 'Artsign',
      commission: 'Commission',
      custom: 'Custom Work',
      budget: 'Budget',
      budgetMin: 'Minimum',
      budgetMax: 'Maximum (Optional)',
      duration: 'Duration (days)',
      durationPlaceholder: 'e.g. 30',
      slots: 'Usage Type',
      private: 'Private Use',
      public: 'Public Slots',
      type: 'Job Type',
      typePlaceholder: 'e.g. Profile Picture, Personal Use',
      description: 'Description',
      descriptionPlaceholder: 'Describe the job details...',
      reference: 'Reference Link (Optional)',
      referencePlaceholder: 'https://...',
      cancel: 'Cancel',
      submit: 'Post Job',
      loginRequired: 'Please login to post a job',
      success: 'Job posted successfully!',
      error: 'An error occurred. Please try again.'
    }
  };

  const t = translations[language] || translations.th;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert(t.loginRequired);
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'jobs'), {
        ...formData,
        budgetMin: parseInt(formData.budgetMin),
        budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        duration: parseInt(formData.duration),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Anonymous',
        status: 'open',
        createdAt: serverTimestamp()
      });

      alert(t.success);
      navigate('/artseek');
    } catch (error) {
      console.error('Error creating job:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center py-20">
          <div className="bg-[#1a1a1a] rounded-3xl shadow-xl p-12">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{t.loginRequired}</h2>
            <p className="text-gray-400 mb-8">เข้าสู่ระบบเพื่อเริ่มโพสต์งานและค้นหาศิลปินที่ใช่สำหรับคุณ</p>
            <Link to="/login">
              <button className="px-8 py-4 bg-gradient-to-r from-teal-500 via-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                เข้าสู่ระบบ
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/artseek" className="inline-flex items-center gap-2 text-gray-400 hover:text-purple-600 transition-colors mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">กลับไปยัง Artseek</span>
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-4 bg-gradient-to-br from-teal-500 via-purple-600 to-pink-600 rounded-2xl shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {t.title}
            </h1>
            <p className="text-gray-300">{t.subtitle}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          {/* Job Title */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              {t.jobTitle} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t.jobTitlePlaceholder}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              {t.category} <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="artsign">{t.artsign}</option>
              <option value="commission">{t.commission}</option>
              <option value="custom">{t.custom}</option>
            </select>
          </div>

          {/* Budget */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              <Gem className="inline w-5 h-5 mr-2 text-pink-600" />
              {t.budget} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
                placeholder={t.budgetMin}
                required
                min="0"
                className="px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                placeholder={t.budgetMax}
                min="0"
                className="px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              <Clock className="inline w-5 h-5 mr-2 text-cyan-600" />
              {t.duration} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder={t.durationPlaceholder}
              required
              min="1"
              className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Slots */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              <User className="inline w-5 h-5 mr-2 text-purple-600" />
              {t.slots}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer px-6 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl hover:border-purple-500 transition-all">
                <input
                  type="radio"
                  name="slots"
                  checked={formData.slots === true}
                  onChange={() => setFormData(prev => ({ ...prev, slots: true }))}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-white font-medium">{t.private}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-6 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl hover:border-purple-500 transition-all">
                <input
                  type="radio"
                  name="slots"
                  checked={formData.slots === false}
                  onChange={() => setFormData(prev => ({ ...prev, slots: false }))}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-white font-medium">{t.public}</span>
              </label>
            </div>
          </div>

          {/* Type */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              {t.type} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder={t.typePlaceholder}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              <FileText className="inline w-5 h-5 mr-2 text-gray-400" />
              {t.description} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t.descriptionPlaceholder}
              required
              rows="6"
              className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          {/* Reference */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-2">
              {t.reference}
            </label>
            <input
              type="url"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder={t.referencePlaceholder}
              className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Link to="/artseek" className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-4 bg-gray-200 text-white rounded-full font-semibold hover:bg-gray-300 transition-all"
              >
                {t.cancel}
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-teal-500 via-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'กำลังโพสต์...' : t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;

