const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const PASSCODE = "1805"; // Simple passcode for access

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create directories
fs.ensureDirSync('uploads');
fs.ensureDirSync('data');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Configure nodemailer (you'll need to update with real email credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Update with your email
    pass: 'your-app-password'     // Update with your app password
  }
});

// Data storage (in production, use a proper database)
let grievances = [];
const grievancesFile = 'data/grievances.json';

// Load existing grievances
if (fs.existsSync(grievancesFile)) {
  try {
    grievances = JSON.parse(fs.readFileSync(grievancesFile, 'utf8'));
  } catch (error) {
    console.log('Error loading grievances:', error);
    grievances = [];
  }
}

// Save grievances to file
function saveGrievances() {
  fs.writeFileSync(grievancesFile, JSON.stringify(grievances, null, 2));
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Verify passcode
app.post('/api/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  if (passcode === PASSCODE) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid passcode' });
  }
});

// Get all grievances
app.get('/api/grievances', (req, res) => {
  res.json(grievances);
});

// Submit new grievance
app.post('/api/grievances', upload.single('photo'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const grievance = {
      id: uuidv4(),
      title,
      description,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      timestamp: new Date().toISOString(),
      status: 'Open'
    };

    grievances.unshift(grievance); // Add to beginning of array
    saveGrievances();

    // Emit to all connected clients
    io.emit('newGrievance', grievance);

    // Send email notification
    try {
      await transporter.sendMail({
        from: 'your-email@gmail.com',
        to: 'admin@example.com', // Update with admin email
        subject: `New Grievance: ${title}`,
        html: `
          <h2>New Grievance Submitted</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Submitted at:</strong> ${new Date(grievance.timestamp).toLocaleString()}</p>
          ${grievance.photo ? `<p><strong>Photo:</strong> Attached</p>` : ''}
        `
      });
      console.log('Email notification sent successfully');
    } catch (emailError) {
      console.log('Email notification failed:', emailError.message);
    }

    res.json({ success: true, grievance });
  } catch (error) {
    console.error('Error submitting grievance:', error);
    res.status(500).json({ error: 'Failed to submit grievance' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Grievance Portal server running on port ${PORT}`);
  console.log(`Access the portal at: http://localhost:${PORT}`);
});
