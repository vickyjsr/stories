// Initialize Socket.IO
// const socket = io(); // Removed as it's not used in a static setup

// DOM Elements
const passcodeScreen = document.getElementById('passcodeScreen');
const mainScreen = document.getElementById('mainScreen');
const passcodeForm = document.getElementById('passcodeForm');
const passcodeInput = document.getElementById('passcodeInput');
const passcodeError = document.getElementById('passcodeError');
const logoutBtn = document.getElementById('logoutBtn');
const storyForm = document.getElementById('storyForm');
const storiesList = document.getElementById('storiesList');
const successModal = document.getElementById('successModal');
const loadingSpinner = document.getElementById('loadingSpinner');
const fileInput = document.getElementById('photo');
const filePreview = document.getElementById('filePreview');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// State
let isAuthenticated = false;
let stories = [];

// Firebase references
let db, storage;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if already authenticated (simple session check)
    const isAuth = sessionStorage.getItem('authenticated');
    if (isAuth === 'true') {
        initializeFirebase(); // Initialize first
        showMainScreen(); // Then show screen
    }
    
    // Load stories
    // loadStories(); // Will be called when switching tab or after login
    
    // Setup event listeners
    setupEventListeners();
    
    // Start background animation
    animateBackground();
});

// Initialize Firebase
function initializeFirebase() {
    if (firebase.apps.length) {
        db = firebase.firestore();
        storage = firebase.storage();
        return; // Already initialized
    }
    if (window.firebase && window.firebaseConfig) {
        // Initialize Firebase
        firebase.initializeApp(window.firebaseConfig);
        db = firebase.firestore();
        storage = firebase.storage();
        console.log("Firebase initialized successfully");
    } else {
        console.error("Firebase config not found. Make sure firebase-config.js is loaded and configured.");
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Passcode form
    passcodeForm.addEventListener('submit', handlePasscodeSubmit);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Story form
    storyForm.addEventListener('submit', handleStorySubmit);
    
    // File input
    fileInput.addEventListener('change', handleFileSelect);
    
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Handle passcode submission
async function handlePasscodeSubmit(e) {
    e.preventDefault();
    
    const passcode = passcodeInput.value.trim();
    if (!passcode) return;
    
    showLoading();
    
    try {
        // Client-side passcode check
        const passcodes = window.firebaseConfig.passcode || {};
        const user = passcodes[passcode];

        if (user && user.username) {
            sessionStorage.setItem('authenticated', 'true');
            sessionStorage.setItem('username', user.username); // Store the username string
            initializeFirebase(); // Initialize Firebase before showing the main screen
            showMainScreen();
            passcodeInput.value = '';
            passcodeError.classList.remove('show');
        } else {
            showError('Invalid passcode');
            passcodeInput.value = '';
            passcodeInput.focus();
        }
    } catch (error) {
        console.error('Passcode verification error:', error);
        showError('An unexpected error occurred.');
    } finally {
        hideLoading();
    }
}

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('authenticated');
    isAuthenticated = false;
    showPasscodeScreen();
}

// Handle story submission
async function handleStorySubmit(e) {
    e.preventDefault();
    
    showLoading();

    const name = sessionStorage.getItem('username');
    if (!name) {
        alert('Could not find user information. Please log in again.');
        hideLoading();
        return;
    }

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const file = fileInput.files[0];
    let photoUrl = '';

    try {
        if (file) {
            const filePath = `Preeti/${name}/${Date.now()}_${file.name}`;
            const storageRef = storage.ref(filePath);
            const uploadTask = await storageRef.put(file);
            photoUrl = await uploadTask.ref.getDownloadURL();
        }

        await db.collection("stories").add({
            name: name,
            title: title,
            description: description,
            photo: photoUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        storyForm.reset();
        filePreview.innerHTML = '';
        
        showSuccessModal();
        
        setTimeout(() => {
            switchTab('view');
        }, 2000);

    } catch (error) {
        console.error('Story submission error:', error);
        alert('Error submitting story: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) {
        filePreview.innerHTML = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        fileInput.value = '';
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        fileInput.value = '';
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        filePreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <p style="margin-top: 10px; color: #666; font-size: 14px;">${file.name}</p>
        `;
    };
    reader.readAsDataURL(file);
}

// Load stories from Firestore
async function loadStories() {
    if (!db) {
        console.log("Firestore not initialized, skipping loading stories.");
        return;
    }
    try {
        const snapshot = await db.collection("stories").orderBy("timestamp", "desc").get();
        stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderStories();
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Render stories
function renderStories() {
    if (stories.length === 0) {
        storiesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>No stories yet.</p>
            </div>
        `;
        return;
    }
    
    storiesList.innerHTML = stories.map(story => `
        <div class="story-item">
            <div class="story-header">
                <h3 class="story-title">${escapeHtml(story.title)}</h3>
                <span class="story-author">by ${escapeHtml(story.name || 'Anonymous')}</span>
            </div>
            <div class="story-description">
                ${escapeHtml(story.description)}
            </div>
            ${story.photo ? `
                <div class="story-photo">
                    <img src="${story.photo}" alt="Story photo" onclick="showImageModal('${story.photo}')">
                </div>
            ` : ''}
            <div class="story-meta">
                <span><i class="fas fa-user-circle"></i> ${escapeHtml(story.name || 'Anonymous')}</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(story.timestamp)}</span>
                <span><i class="fas fa-clock"></i> ${formatTime(story.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// Switch tabs
function switchTab(tabName) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Reload stories if switching to view tab
    if (tabName === 'view') {
        loadStories();
    }
}

// Screen management
function showPasscodeScreen() {
    passcodeScreen.classList.add('active');
    mainScreen.classList.remove('active');
    setTimeout(() => passcodeInput.focus(), 100);
}

function showMainScreen() {
    passcodeScreen.classList.remove('active');
    mainScreen.classList.add('active');
    isAuthenticated = true;
    loadStories(); // Load stories after login
}

// Error handling
function showError(message) {
    passcodeError.textContent = message;
    passcodeError.classList.add('show');
    setTimeout(() => {
        passcodeError.classList.remove('show');
    }, 5000);
}

// Modal management
function showSuccessModal() {
    successModal.style.display = 'block';
    setTimeout(() => {
        closeModal();
    }, 3000);
}

function closeModal() {
    successModal.style.display = 'none';
}

// Loading management
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Notification system
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff69b4, #ff1493);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(255, 20, 147, 0.4);
        z-index: 1001;
        font-weight: 500;
        animation: slideInRight 0.5s ease;
    `;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Image modal
function showImageModal(src) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Background animation
function animateBackground() {
    const emojis = document.querySelectorAll('.emoji-float');
    
    setInterval(() => {
        emojis.forEach((emoji, index) => {
            const delay = index * 200;
            setTimeout(() => {
                const currentTransform = emoji.style.transform || '';
                emoji.style.transform = currentTransform + ' translateZ(10px)';
                
                setTimeout(() => {
                    emoji.style.transform = currentTransform;
                }, 1000);
            }, delay);
        });
    }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
