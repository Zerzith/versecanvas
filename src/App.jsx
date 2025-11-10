import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocialProvider } from './contexts/SocialContext';
import { CreditProvider } from './contexts/CreditContext';
import { EscrowProvider } from './contexts/EscrowContext';
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
      <CreditProvider>
        <EscrowProvider>
          <SocialProvider>
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
              <Route path="/artseek" element={<Artseek currentLanguage={currentLanguage} />} />
              <Route path="/job/:jobId" element={<JobDetail currentLanguage={currentLanguage} />} />
              <Route path="/create-job" element={<CreateJob currentLanguage={currentLanguage} />} />
              <Route path="/admin" element={<AdminDashboard currentLanguage={currentLanguage} />} />
              <Route path="/profile/:userId" element={<Profile currentLanguage={currentLanguage} />} />
              <Route path="/profile" element={<Profile currentLanguage={currentLanguage} />} />
              <Route path="/settings" element={<Settings currentLanguage={currentLanguage} />} />
              <Route path="/messages" element={<Messages currentLanguage={currentLanguage} />} />
              <Route path="/shop" element={<Shop currentLanguage={currentLanguage} />} />
              <Route path="/add-product" element={<AddProduct currentLanguage={currentLanguage} />} />
              <Route path="/edit-product/:productId" element={<EditProduct currentLanguage={currentLanguage} />} />
              <Route path="/credits" element={<Credits currentLanguage={currentLanguage} />} />
              <Route path="/my-jobs" element={<JobManagement currentLanguage={currentLanguage} />} />
              <Route path="/escrow" element={<EscrowManagement currentLanguage={currentLanguage} />} />
              <Route path="/story/:storyId/edit" element={<EditStory currentLanguage={currentLanguage} />} />
              <Route path="/story/:storyId/add-chapter" element={<AddChapter currentLanguage={currentLanguage} />} />
            </Routes>
          </main>
          <Footer currentLanguage={currentLanguage} />
        </div>
        </ProtectedContent>
        </Router>
          </SocialProvider>
        </EscrowProvider>
      </CreditProvider>
    </AuthProvider>
  );
}

export default App;

