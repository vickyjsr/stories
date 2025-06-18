// Firebase imports (loaded from HTML)
let db; // No storage needed for base64 approach

// Configuration
const ADMIN_EMAIL = "gouravmodi10@gmail.com"; // Update with your email for notifications

// Current user info (set after successful login)
let currentUser = null;

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
let unsubscribe = null; // For Firebase listener

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be loaded
    setTimeout(initializeApp, 100);
});

async function initializeApp() {
    try {
        // Get Firebase instances
        if (window.firebase) {
            db = window.firebase.db;
            
            console.log('Firebase initialized successfully (base64 image storage)');
            
            // Initialize sample passcodes if needed
            // await initializeSamplePasscodes();
        } else {
            console.error('Firebase not loaded. Please check your configuration.');
            return;
        }
        
        // Check if already authenticated
        const isAuth = sessionStorage.getItem('authenticated');
        const userData = sessionStorage.getItem('currentUser');
        if (isAuth === 'true' && userData) {
            currentUser = JSON.parse(userData);
            showMainScreen();
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Start background animation
        animateBackground();
        
        // Setup EmailJS (for email notifications)
        setupEmailJS();
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Setup EmailJS for client-side emails
function setupEmailJS() {
    // Load EmailJS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
        // Initialize EmailJS with your public key
        emailjs.init("your-emailjs-public-key"); // Replace with your EmailJS public key
    };
    document.head.appendChild(script);
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
        // Validate passcode against the passcodes collection
        const user = await validatePasscode(passcode);
        
        if (user) {
            currentUser = user;
            sessionStorage.setItem('authenticated', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            showMainScreen();
            passcodeInput.value = '';
            passcodeError.classList.remove('show');
            
            // Show welcome message with username
            showNotification(`Welcome back, ${user.username}! 💕✨`);
        } else {
            showError('Oops! That\'s not a valid passcode 💔');
            passcodeInput.value = '';
            passcodeInput.focus();
        }
    } catch (error) {
        console.error('Passcode verification error:', error);
        showError('Connection error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Validate passcode against Firestore passcodes collection
async function validatePasscode(inputPasscode) {
    try {
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Query the passcodes collection for matching passcode
        const q = query(
            collection(db, 'passcodes'), 
            where('passcode', '==', inputPasscode)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Return the first matching user
            const userDoc = querySnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        }
        
        return null; // No matching passcode found
    } catch (error) {
        console.error('Error validating passcode:', error);
        throw error;
    }
}

// Initialize some sample passcodes (run this once to set up the collection)
async function initializeSamplePasscodes() {
    try {
        const { collection, addDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Check if passcodes collection already has data
        const existingPasscodes = await getDocs(collection(db, 'passcodes'));
        if (!existingPasscodes.empty) {
            console.log('Passcodes collection already initialized');
            return;
        }
        
        // Sample passcodes to initialize the collection
        const samplePasscodes = [
            {
                userId: 'user001',
                username: 'Gourav',
                passcode: '2025',
                createdAt: new Date().toISOString(),
                isActive: true
            },
            {
                userId: 'user002', 
                username: 'Preeti',
                passcode: '2025',
                createdAt: new Date().toISOString(),
                isActive: true
            }
        ];
        
        // Add sample passcodes to Firestore
        for (const passcodeData of samplePasscodes) {
            await addDoc(collection(db, 'passcodes'), passcodeData);
        }
        
        console.log('Sample passcodes initialized successfully');
    } catch (error) {
        console.error('Error initializing sample passcodes:', error);
    }
}

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    isAuthenticated = false;
    
    // Unsubscribe from Firebase listener
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    
    showPasscodeScreen();
}

// Handle story submission
async function handleStorySubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const file = fileInput.files[0];
    
    if (!title || !description) {
        alert('Please fill in both the story title and description to share this beautiful memory! 💕');
        return;
    }
    
    showLoading();
    
    try {
        let photoBase64 = null;
        
        // Convert photo to base64 if provided
        if (file) {
            photoBase64 = await convertImageToBase64(file);
        }
        
        // Create story object
        const story = {
            title,
            description,
            photo: photoBase64,
            timestamp: new Date().toISOString(),
            status: 'Shared',
            id: generateId(),
            // Add user information
            userId: currentUser?.userId || 'unknown',
            username: currentUser?.username || 'Anonymous',
            submittedBy: currentUser?.username || 'Anonymous'
        };
        
        // Add to Firestore
        const { addDoc, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await addDoc(collection(db, 'stories'), story);
        
        // Reset form
        storyForm.reset();
        filePreview.innerHTML = '';
        
        // Show success modal
        showSuccessModal();
        
        // Send email notification
        sendEmailNotification(story);
        
        // Switch to view tab
        setTimeout(() => {
            switchTab('view');
        }, 2000);
        
    } catch (error) {
        console.error('Error sharing story:', error);
        alert('Oops! There was an issue sharing your beautiful story: ' + error.message + ' 💔');
    } finally {
        hideLoading();
    }
}

// Convert image to base64 (no Firebase Storage needed)
async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result); // This is the base64 string
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// Send email notification using EmailJS
function sendEmailNotification(story) {
    if (typeof emailjs === 'undefined') {
        console.log('EmailJS not loaded, skipping email notification');
        return;
    }
    
    const templateParams = {
        to_email: ADMIN_EMAIL,
        subject: `💕 New Life Story Shared: ${story.title}`,
        title: story.title,
        description: story.description,
        timestamp: new Date(story.timestamp).toLocaleString(),
        has_photo: story.photo ? 'Yes! 📸' : 'No photo this time'
    };
    
    emailjs.send('your-service-id', 'your-template-id', templateParams)
        .then(() => {
            console.log('Email notification sent successfully');
        })
        .catch((error) => {
            console.log('Email notification failed:', error);
        });
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
    
    // Validate file size (3MB due to base64 overhead)
    // Base64 increases size by ~33%, so 3MB file becomes ~4MB in base64
    if (file.size > 8 * 1024 * 1024) {
        alert('Your photo is a bit too large! Please choose a smaller image (under 8MB) so we can store this beautiful memory! 📸💕');
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

// Load stories from Firestore with real-time updates
async function loadStories() {
    try {
        const { collection, onSnapshot, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const q = query(collection(db, 'stories'), orderBy('timestamp', 'desc'));
        
        // Set up real-time listener
        unsubscribe = onSnapshot(q, (snapshot) => {
            const previousStoriesCount = stories.length;
            stories = [];
            snapshot.forEach((doc) => {
                stories.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderStories();
            
            // If this is the initial load and we have stories, switch to memories tab
            if (previousStoriesCount === 0 && stories.length > 0 && isAuthenticated) {
                switchTab('view');
            }
            
            // Show notification for new stories (except on initial load)
            if (snapshot.docChanges().some(change => change.type === 'added' && stories.length > 1)) {
                showNotification('New beautiful story shared! 💕✨');
            }
        });
        
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Render stories
function renderStories() {
    if (stories.length === 0) {
        storiesList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <i class="fas fa-heart" style="font-size: 4rem; margin-bottom: 25px; opacity: 0.3; color: #ff69b4;"></i>
                <h3 style="color: #d63384; margin-bottom: 15px; font-size: 1.3rem;">No memories shared yet! 💕</h3>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Start sharing your beautiful life stories and precious moments together! ✨</p>
            </div>
        `;
        return;
    }
    
    storiesList.innerHTML = stories.map(story => `
        <div class="story-item">
            <div class="story-header">
                <h3 class="story-title">${escapeHtml(story.title)}</h3>
                <span class="story-status">${escapeHtml(story.status)} 💕</span>
            </div>
            <div class="story-description">
                ${escapeHtml(story.description)}
            </div>
            ${story.photo ? `
                <div class="story-photo">
                    <img src="${story.photo}" alt="Memory photo" onclick="showImageModal('${story.photo}')">
                </div>
            ` : ''}
            <div class="story-meta">
                <span><i class="fas fa-user-heart"></i> ${escapeHtml(story.submittedBy || story.username || 'Anonymous')}</span>
                <span><i class="fas fa-calendar-heart"></i> ${formatDate(story.timestamp)}</span>
                <span><i class="fas fa-clock"></i> ${formatTime(story.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load stories if switching to view tab
    if (tabName === 'view' && !unsubscribe) {
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
    // Load stories first, which will automatically switch to memories tab if stories exist
    loadStories();
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
    
    document.body.appendChild(notification);
    
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
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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