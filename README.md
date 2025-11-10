# VerseCanvas - Where Stories Meet Art

**VerseCanvas** is a modern web application that provides a platform for creators to write stories, share artwork, and combine both in a creative and engaging way. It's built with React, Firebase, and Cloudinary, offering a comprehensive set of features for both users and administrators.

This project was inspired by the functionalities of ReadAwrite and Arbum, merging a writing platform with an art gallery.

## ✨ Features

### Core Features
- **Hybrid Content Platform**: Users can post stories, upload artworks, or create posts that combine both.
- **Dual Language Support**: Fully functional in both Thai (ไทย) and English (EN), with an easy-to-use language switcher.
- **Responsive Design**: A beautiful, modern UI that works seamlessly on desktops, tablets, and mobile devices.

### Authentication
- **Multiple Sign-in Options**: 
  - Email & Password
  - Google Sign-in
  - Anonymous (Guest) access
- **Firebase Integration**: Secure and reliable user management powered by Firebase Authentication.

### Content Creation & Management
- **Rich Text Editor**: A powerful WYSIWYG editor for writing stories, with options for formatting, lists, links, and more.
- **Art Gallery**: A beautiful masonry-style gallery to showcase artworks.
- **Cloudinary for Images**: All images are uploaded and optimized through Cloudinary, ensuring fast delivery and easy management.
- **Categorization & Tagging**: Organize stories and artworks with predefined categories and custom tags.

### User Interaction
- **Social Features**: Users can like, comment on, and share content.
- **User Profiles**: Each user has a profile page to showcase their creations.
- **Follow System**: (Future implementation) Users will be able to follow their favorite creators.

### Administration
- **Admin Dashboard**: A protected area for administrators to manage the platform.
- **User Management**: View all users and manage their roles (promote to admin/demote to user).
- **Content Moderation**: View and delete stories or artworks that violate community guidelines.
- **Platform Statistics**: An overview of key metrics like total users, stories, artworks, and views.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Node.js (v18 or later)
- pnpm (or npm/yarn)

### Installation & Setup

1. **Clone the repository (or download the source code)**
   ```sh
   git clone <your-repo-url>
   cd versecanvas
   ```

2. **Install Dependencies**
   ```sh
   pnpm install
   ```

3. **Configure Firebase**
   - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** with Email/Password, Google, and Anonymous providers.
   - Set up **Firestore Database** in test mode for now.
   - In your project settings, get your Firebase config object.
   - Open `src/lib/firebase.js` and replace the placeholder values with your actual Firebase config:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

4. **Configure Cloudinary**
   - Sign up for a [Cloudinary](https://cloudinary.com/) account.
   - In your dashboard, find your **Cloud Name**.
   - Go to **Settings > Upload** and create a new **Upload Preset**.
   - Set the preset to be **Unsigned**.
   - Open `src/lib/cloudinary.js` and replace the placeholder values:
     ```javascript
     const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
     const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';
     ```

5. **Run the Development Server**
   ```sh
   pnpm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 📁 Project Structure

```
/src
├── assets/           # Static assets (images, fonts)
├── components/       # Reusable React components (Navbar, Footer, UI elements)
├── contexts/         # React Context providers (AuthContext)
├── hooks/            # Custom React hooks
├── lib/              # Library integrations (Firebase, Cloudinary)
├── pages/            # Page components for each route
├── App.css           # Global styles and custom CSS
├── App.jsx           # Main application component with routing
└── main.jsx          # React entry point
```

## 🔧 Technologies Used

- **Frontend**: React.js, Vite, Tailwind CSS, shadcn/ui
- **Backend & Database**: Firebase (Authentication, Firestore)
- **Image Management**: Cloudinary
- **Routing**: React Router
- **State Management**: React Context API
- **Internationalization (i18n)**: Implemented via React state (can be extended with i18next)
- **Rich Text Editing**: React Quill

## 👤 Admin Access

To gain admin access:
1. Sign up for a new account on your local instance.
2. Go to your **Firebase Console** -> **Firestore Database**.
3. Find the `users` collection and locate your user document.
4. Change the `role` field from `"user"` to `"admin"`.
5. You can now access the Admin Dashboard by navigating to `/admin`.

---

*This project was generated and developed by Manus AI.*

