# 🚀 Environment Variables & GitHub Pages Deployment Guide

## 🚨 Security Notice
This project uses secure environment-based Firebase configuration to prevent API key exposure in version control.

## 🏠 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
# Copy the example and edit with your values
cp .env.example .env
```

Add your Firebase configuration to `.env`:
```env
FIREBASE_API_KEY=your_actual_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:your-app-id
```

### 3. Build Configuration
```bash
# Generate Firebase config from environment variables
npm run build:dev

# Or for production (uses system environment variables)
npm run build
```

### 4. Run Locally
```bash
# Start the Express server
npm start

# Or for development with auto-reload
npm run dev

# Or serve static files only
npm run serve
```

## 🌐 GitHub Pages Deployment

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Settings → Pages
3. Source: **GitHub Actions**
4. Save

### 2. Set Up GitHub Secrets
Go to your repository → Settings → Secrets and variables → Actions

Add these Repository Secrets:
- `FIREBASE_API_KEY` = Your Firebase API key
- `FIREBASE_AUTH_DOMAIN` = your-project.firebaseapp.com  
- `FIREBASE_DATABASE_URL` = https://your-project-default-rtdb.firebaseio.com
- `FIREBASE_PROJECT_ID` = your-project-id
- `FIREBASE_STORAGE_BUCKET` = your-project.appspot.com
- `FIREBASE_MESSAGING_SENDER_ID` = Your messaging sender ID
- `FIREBASE_APP_ID` = Your Firebase app ID

### 3. Deploy
Push to the `main` branch - GitHub Actions will automatically:
1. Build the site with your secrets
2. Generate the Firebase config
3. Deploy to GitHub Pages

Your site will be available at: `https://username.github.io/repository-name`

## 📋 Firebase Configuration Steps

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