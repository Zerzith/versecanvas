import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    // Display Settings
    theme: 'dark',
    language: 'th',
    fontSize: 'medium',
    
    // Privacy Settings
    profileVisibility: 'public',
    showEmail: false,
    showFollowers: true,
    allowMessages: true,
    allowComments: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    newFollower: true,
    newComment: true,
    newLike: true,
    newMessage: true,
    commissionRequest: true,
    
    // Content Settings
    nsfwFilter: true,
    autoplay: false,
    showSensitiveContent: false,
    
    // Account Settings
    twoFactorAuth: false,
    loginAlerts: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadSettings = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().settings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...userDoc.data().settings
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    if (!currentUser) return;
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save to Firebase
      await updateDoc(doc(db, 'users', currentUser.uid), {
        settings: updatedSettings
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    }
  };

  const updateSetting = async (key, value) => {
    return updateSettings({ [key]: value });
  };

  const resetSettings = async () => {
    if (!currentUser) return;
    
    try {
      const defaultSettings = {
        theme: 'dark',
        language: 'th',
        fontSize: 'medium',
        profileVisibility: 'public',
        showEmail: false,
        showFollowers: true,
        allowMessages: true,
        allowComments: true,
        emailNotifications: true,
        pushNotifications: true,
        newFollower: true,
        newComment: true,
        newLike: true,
        newMessage: true,
        commissionRequest: true,
        nsfwFilter: true,
        autoplay: false,
        showSensitiveContent: false,
        twoFactorAuth: false,
        loginAlerts: true,
      };
      
      setSettings(defaultSettings);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        settings: defaultSettings
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting settings:', error);
      return { success: false, error };
    }
  };

  const value = {
    settings,
    loading,
    updateSettings,
    updateSetting,
    resetSettings,
    loadSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
