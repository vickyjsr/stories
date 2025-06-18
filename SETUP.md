# 🔧 Firebase Setup Guide

## 🚨 Security Notice
This project now uses secure Firebase configuration to prevent API key exposure in version control.

## 📋 Setup Steps

### 1. Create Firebase Configuration File
1. Copy the template: `cp public/firebase-config.template.js public/firebase-config.js`
2. Edit `public/firebase-config.js` with your actual Firebase values
3. Get your Firebase config from [Firebase Console](https://console.firebase.google.com) > Project Settings > Your apps

### 2. Firebase Configuration Values
Replace these in `public/firebase-config.js`:
```javascript
window.firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:your-app-id"
};
```

### 3. Additional Security Measures

#### A. Firebase Security Rules
Update your Firestore rules to restrict access:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restrict to specific domains or authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### B. API Key Restrictions (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to APIs & Services > Credentials
4. Find your API key and click edit
5. Under "Application restrictions", select "HTTP referrers"
6. Add your domain(s):
   - `https://yourdomain.com/*`
   - `http://localhost:*` (for development)

#### C. Firebase App Check (Advanced)
For production apps, enable Firebase App Check for additional security.

## 🔐 Why This Approach?

### Firebase Web API Keys Are Different
Unlike server-side API keys, Firebase web API keys are:
- **Designed to be public** (visible in deployed apps)
- **Not authentication tokens** (security via Firebase Rules)
- **Project identifiers** (not secret credentials)

### Security Through Rules & Restrictions
- **Firebase Security Rules** control data access
- **API Key restrictions** limit usage to your domains
- **Authentication** (optional) adds user-level security

## 🚀 Deployment
1. Ensure `firebase-config.js` is in your deployment but NOT in git
2. Set up your hosting environment to include the config file
3. Configure domain restrictions for production

## 🛠️ Development
1. Copy the template to create your local config
2. Never commit `firebase-config.js` to version control
3. Share the template file with team members

---
**✨ Your Firebase setup is now secure and production-ready! ✨** 