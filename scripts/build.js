#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to generate Firebase config from environment variables
function generateFirebaseConfig() {
    const config = {
        apiKey: process.env.FIREBASE_API_KEY || 'your-api-key-here',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://your-project-default-rtdb.firebaseio.com',
        projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
        appId: process.env.FIREBASE_APP_ID || '1:123456789:web:your-app-id'
    };

    const configJs = `// Firebase Configuration - Generated from environment variables
// This file is auto-generated. Do not edit manually.

window.firebaseConfig = {
    apiKey: "${config.apiKey}",
    authDomain: "${config.authDomain}",
    databaseURL: "${config.databaseURL}",
    projectId: "${config.projectId}",
    storageBucket: "${config.storageBucket}",
    messagingSenderId: "${config.messagingSenderId}",
    appId: "${config.appId}"
};

console.log('🔥 Firebase initialized with environment config');
`;

    // Write the config file
    const outputPath = path.join(__dirname, '../public/firebase-config.js');
    fs.writeFileSync(outputPath, configJs);
    
    console.log('✅ Firebase config generated successfully!');
    console.log(`📄 Config written to: ${outputPath}`);
    
    // Verify all values are set
    const envVarMap = {
        'apiKey': 'FIREBASE_API_KEY',
        'authDomain': 'FIREBASE_AUTH_DOMAIN',
        'databaseURL': 'FIREBASE_DATABASE_URL',
        'projectId': 'FIREBASE_PROJECT_ID',
        'storageBucket': 'FIREBASE_STORAGE_BUCKET',
        'messagingSenderId': 'FIREBASE_MESSAGING_SENDER_ID',
        'appId': 'FIREBASE_APP_ID'
    };
    
    const missingVars = Object.entries(config)
        .filter(([key, value]) => value.includes('your-') || value === '123456789')
        .map(([key]) => envVarMap[key]);
    
    if (missingVars.length > 0) {
        console.warn('⚠️  Warning: The following environment variables are not set:');
        missingVars.forEach(varName => console.warn(`   - ${varName}`));
        console.warn('   Using placeholder values. Set these for production!');
    }
}

// Run the function
generateFirebaseConfig(); 