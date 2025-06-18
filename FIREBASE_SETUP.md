# Firebase Integration Guide for Grievance Portal

## Overview
This guide will help you integrate Firebase with your Grievance Portal to enable:
- Real-time data storage with Firestore
- Base64 image storage directly in Firestore (no Firebase Storage needed)
- Real-time updates for grievances

## Prerequisites
- A Google account
- Your grievance portal project files

## Step 1: Create Firebase Project

1. Visit the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `grievance-portal` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

## Step 2: Enable Required Services

### Enable Firestore Database
1. In Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll configure security later)
4. Choose your preferred location (closest to your users)
5. Click **"Done"**

### Firebase Storage Not Needed
❌ **Skip Firebase Storage setup** - we're using base64 image storage directly in Firestore instead.
✅ This simplifies setup and reduces complexity.

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** (Project Settings)
2. Scroll down to **"Your apps"** section
3. Click **"Add app"** and select **Web** (</> icon)
4. Enter app nickname: `grievance-portal-web`
5. Don't check "Also set up Firebase Hosting"
6. Click **"Register app"**
7. **Copy the firebaseConfig object** - you'll need this next!

## Step 4: Update Your Configuration

1. Open your `public/index.html` file
2. Find the `firebaseConfig` object (around line 18-27)
3. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key-from-firebase",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## Step 5: Deploy Security Rules

### Deploy Firestore Rules (Only Rules Needed)
1. In Firebase Console, go to **"Firestore Database"**
2. Click **"Rules"** tab
3. Replace the default rules with the content from `firestore.rules` file
4. Click **"Publish"**

### Storage Rules Not Needed
❌ **Skip Storage rules** - we're not using Firebase Storage since images are stored as base64 in Firestore.

## Step 6: Test Your Integration

1. Save all your changes
2. Open your `public/index.html` in a web browser
3. Enter the passcode: `1234`
4. Try submitting a test grievance with and without a photo
5. Switch to the "View Grievances" tab to see real-time updates

## Step 7: Optional Email Notifications Setup

If you want email notifications when grievances are submitted:

1. Sign up for [EmailJS](https://www.emailjs.com/)
2. Create an email service and template
3. Update the EmailJS configuration in `script-static.js`:
   - Replace `"your-emailjs-public-key"` with your EmailJS public key
   - Replace `"your-service-id"` and `"your-template-id"` with your actual IDs
   - Update `ADMIN_EMAIL` constant with the admin email address

## Security Considerations

⚠️ **Important for Production:**

The current security rules allow anyone to read/write data. For production:

1. **Enable Firebase Authentication** to secure your app
2. **Update security rules** to require authentication
3. **Use the commented production rules** in the `.rules` files
4. **Add user authentication** to your application

## Troubleshooting

### Common Issues:

1. **"Firebase not loaded" error:**
   - Check that your Firebase configuration is correct
   - Ensure all Firebase config values are replaced (no placeholder values)

2. **Permission denied errors:**
   - Verify your security rules are deployed
   - Check that you're using test mode rules initially

3. **Storage upload failures:**
   - Ensure Firebase Storage is enabled
   - Check file size limits (max 5MB)
   - Verify image file types are supported

4. **Real-time updates not working:**
   - Check browser console for errors
   - Verify Firestore is properly initialized
   - Ensure you're on the "View Grievances" tab to trigger the listener

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all configuration values are correct
3. Ensure Firebase services are enabled in the console
4. Check that security rules are deployed properly

## Next Steps

Once Firebase is working:
1. Customize the passcode (change `PASSCODE` in `script-static.js`)
2. Set up proper authentication for production
3. Configure email notifications
4. Customize the UI and branding as needed 