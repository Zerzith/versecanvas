import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocialProvider } from './contexts/SocialContext';
import { CreditProvider } from './contexts/CreditContext';
import { EscrowProvider } from './contexts/EscrowContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import CreateStory from './pages/CreateStory';
import Explore from './pages/Explore';
import AdminDashboard from './pages/AdminDashboard';
import Artseek from './pages/Artseek';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import Shop from './pages/Shop';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import JobManagement from './pages/JobManagement';
import Credits from './pages/Credits';
import EscrowManagement from './pages/EscrowManagement';
import EditStory from './pages/EditStory';
import AddChapter from './pages/AddChapter';
import EditChapter from './pages/EditChapter';
import EditArtwork from './pages/EditArtwork';
import GlobalSearch from './pages/GlobalSearch';

import CreatorDashboard from './pages/CreatorDashboard';

import OrderHistory from './pages/OrderHistory';
import TransactionHistory from './pages/TransactionHistory';
import ArtistJobManagement from './pages/ArtistJobManagement';
import ClientJobReview from './pages/ClientJobReview';
import Artworks from './pages/Artworks';
import ArtworkDetail from './pages/ArtworkDetail';
import UploadArtwork from './pages/UploadArtwork';
import Withdraw from './pages/Withdraw';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboardNew from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ContentManagement from './pages/admin/ContentManagement';
import TransactionManagement from './pages/admin/TransactionManagement';
import Reports from './pages/admin/Reports';
import Analytics from './pages/admin/Analytics';
import ProtectedContent from './components/ProtectedContent';
import './App.css';
import './protected.css';

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('th');

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
  };

  return (
    <AuthProvider>
      <SettingsProvider>
        <SocialProvider>
          <CreditProvider>
            <EscrowProvider>
              <NotificationProvider>
                <Router>
                  <ProtectedContent>
                    <div className="flex flex-col min-h-screen">
                      <Navbar 
                        onLanguageChange={handleLanguageChange} 
                        currentLanguage={currentLanguage} 
                      />
                      <main className="flex-grow">
                        <Routes>
                          <Route path="/" element={<Home currentLanguage={currentLanguage} />} />
                          <Route path="/login" element={<Login currentLanguage={currentLanguage} />} />
                          <Route path="/signup" element={<Signup currentLanguage={currentLanguage} />} />
                          <Route path="/stories" element={<Stories currentLanguage={currentLanguage} />} />
                          <Route path="/story/:storyId" element={<StoryDetail currentLanguage={currentLanguage} />} />
                          <Route path="/create-story" element={<CreateStory currentLanguage={currentLanguage} />} />
                          <Route path="/explore" element={<Explore currentLanguage={currentLanguage} />} />
                          <Route path="/search" element={<GlobalSearch currentLanguage={currentLanguage} />} />

                          <Route path="/dashboard" element={<CreatorDashboard currentLanguage={currentLanguage} />} />
                          <Route path="/artworks" element={<Artworks currentLanguage={currentLanguage} />} />
                          <Route path="/artwork/:artworkId" element={<ArtworkDetail currentLanguage={currentLanguage} />} />
                          <Route path="/upload-artwork" element={<UploadArtwork currentLanguage={currentLanguage} />} />
                          <Route path="/artwork/:artworkId/edit" element={<EditArtwork currentLanguage={currentLanguage} />} />
                          <Route path="/artseek" element={<Artseek currentLanguage={currentLanguage} />} />
                          <Route path="/job/:jobId" element={<JobDetail currentLanguage={currentLanguage} />} />
                          <Route path="/create-job" element={<CreateJob currentLanguage={currentLanguage} />} />
                          {/* New Admin Routes */}
                          <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboardNew /></AdminLayout></AdminRoute>} />
                          <Route path="/admin/users" element={<AdminRoute><AdminLayout><UserManagement /></AdminLayout></AdminRoute>} />
                          <Route path="/admin/content" element={<AdminRoute><AdminLayout><ContentManagement /></AdminLayout></AdminRoute>} />
                          <Route path="/admin/transactions" element={<AdminRoute><AdminLayout><TransactionManagement /></AdminLayout></AdminRoute>} />
                          <Route path="/admin/reports" element={<AdminRoute><AdminLayout><Reports /></AdminLayout></AdminRoute>} />
                          <Route path="/admin/analytics" element={<AdminRoute><AdminLayout><Analytics /></AdminLayout></AdminRoute>} />
                          
                          {/* Old Admin Routes */}
                          <Route path="/admin/old" element={<AdminDashboard currentLanguage={currentLanguage} />} />
                          <Route path="/admin/withdrawals" element={<AdminWithdrawals currentLanguage={currentLanguage} />} />
                          <Route path="/profile/:userId" element={<Profile currentLanguage={currentLanguage} />} />
                          <Route path="/profile" element={<Profile currentLanguage={currentLanguage} />} />
                          <Route path="/settings" element={<Settings currentLanguage={currentLanguage} />} />
                          <Route path="/messages" element={<Messages currentLanguage={currentLanguage} />} />
                          <Route path="/shop" element={<Shop currentLanguage={currentLanguage} />} />
                          <Route path="/add-product" element={<AddProduct currentLanguage={currentLanguage} />} />
                          <Route path="/edit-product/:productId" element={<EditProduct currentLanguage={currentLanguage} />} />
                          <Route path="/credits" element={<Credits currentLanguage={currentLanguage} />} />
                          <Route path="/withdraw" element={<Withdraw currentLanguage={currentLanguage} />} />
                          <Route path="/my-jobs" element={<JobManagement currentLanguage={currentLanguage} />} />
                          <Route path="/escrow" element={<EscrowManagement currentLanguage={currentLanguage} />} />
                          <Route path="/story/:storyId/edit" element={<EditStory currentLanguage={currentLanguage} />} />
                          <Route path="/story/:storyId/add-chapter" element={<AddChapter currentLanguage={currentLanguage} />} />
                          <Route path="/story/:storyId/chapter/:chapterId/edit" element={<EditChapter currentLanguage={currentLanguage} />} />

                          <Route path="/orders" element={<OrderHistory currentLanguage={currentLanguage} />} />
                          <Route path="/transactions" element={<TransactionHistory currentLanguage={currentLanguage} />} />
                          <Route path="/artist-jobs" element={<ArtistJobManagement currentLanguage={currentLanguage} />} />
                          <Route path="/job/:jobId/review" element={<ClientJobReview currentLanguage={currentLanguage} />} />
                        </Routes>
                      </main>
                      <Footer currentLanguage={currentLanguage} />
                    </div>
                  </ProtectedContent>
                </Router>
              </NotificationProvider>
            </EscrowProvider>
          </CreditProvider>
        </SocialProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

// Trigger Redeploy Wed Dec 31 21:49:11 EST 2025
