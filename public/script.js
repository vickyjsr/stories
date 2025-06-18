// Initialize Socket.IO
const socket = io();

// DOM Elements
const passcodeScreen = document.getElementById('passcodeScreen');
const mainScreen = document.getElementById('mainScreen');
const passcodeForm = document.getElementById('passcodeForm');
const passcodeInput = document.getElementById('passcodeInput');
const passcodeError = document.getElementById('passcodeError');
const logoutBtn = document.getElementById('logoutBtn');
const grievanceForm = document.getElementById('grievanceForm');
const grievancesList = document.getElementById('grievancesList');
const successModal = document.getElementById('successModal');
const loadingSpinner = document.getElementById('loadingSpinner');
const fileInput = document.getElementById('photo');
const filePreview = document.getElementById('filePreview');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// State
let isAuthenticated = false;
let grievances = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if already authenticated (simple session check)
    const isAuth = sessionStorage.getItem('authenticated');
    if (isAuth === 'true') {
        showMainScreen();
    }
    
    // Load grievances
    loadGrievances();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start background animation
    animateBackground();
});

// Setup Event Listeners
function setupEventListeners() {
    // Passcode form
    passcodeForm.addEventListener('submit', handlePasscodeSubmit);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Grievance form
    grievanceForm.addEventListener('submit', handleGrievanceSubmit);
    
    // File input
    fileInput.addEventListener('change', handleFileSelect);
    
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Socket events
    socket.on('newGrievance', handleNewGrievance);
    
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
        const response = await fetch('/api/verify-passcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ passcode })
        });
        
        const result = await response.json();
        
        if (result.success) {
            sessionStorage.setItem('authenticated', 'true');
            showMainScreen();
            passcodeInput.value = '';
            passcodeError.classList.remove('show');
        } else {
            showError(result.message || 'Invalid passcode');
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

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('authenticated');
    isAuthenticated = false;
    showPasscodeScreen();
}

// Handle grievance submission
async function handleGrievanceSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value.trim());
    formData.append('description', document.getElementById('description').value.trim());
    
    if (fileInput.files[0]) {
        formData.append('photo', fileInput.files[0]);
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/grievances', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Reset form
            grievanceForm.reset();
            filePreview.innerHTML = '';
            
            // Show success modal
            showSuccessModal();
            
            // Switch to view tab
            setTimeout(() => {
                switchTab('view');
            }, 2000);
        } else {
            throw new Error(result.error || 'Failed to submit grievance');
        }
    } catch (error) {
        console.error('Grievance submission error:', error);
        alert('Error submitting grievance: ' + error.message);
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

// Handle new grievance from socket
function handleNewGrievance(grievance) {
    grievances.unshift(grievance);
    renderGrievances();
    
    // Show notification if not on view tab
    if (!document.getElementById('viewTab').classList.contains('active')) {
        showNotification('New grievance received!');
    }
}

// Load grievances from server
async function loadGrievances() {
    try {
        const response = await fetch('/api/grievances');
        grievances = await response.json();
        renderGrievances();
    } catch (error) {
        console.error('Error loading grievances:', error);
    }
}

// Render grievances
function renderGrievances() {
    if (grievances.length === 0) {
        grievancesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>No grievances yet.</p>
            </div>
        `;
        return;
    }
    
    grievancesList.innerHTML = grievances.map(grievance => `
        <div class="grievance-item">
            <div class="grievance-header">
                <h3 class="grievance-title">${escapeHtml(grievance.title)}</h3>
                <span class="grievance-status">${escapeHtml(grievance.status)}</span>
            </div>
            <div class="grievance-description">
                ${escapeHtml(grievance.description)}
            </div>
            ${grievance.photo ? `
                <div class="grievance-photo">
                    <img src="${grievance.photo}" alt="Grievance photo" onclick="showImageModal('${grievance.photo}')">
                </div>
            ` : ''}
            <div class="grievance-meta">
                <span><i class="fas fa-calendar"></i> ${formatDate(grievance.timestamp)}</span>
                <span><i class="fas fa-clock"></i> ${formatTime(grievance.timestamp)}</span>
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
    
    // Reload grievances if switching to view tab
    if (tabName === 'view') {
        loadGrievances();
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
    loadGrievances();
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
