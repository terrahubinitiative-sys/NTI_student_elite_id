const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'AdminPass123!', 10);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database Setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error("Database Connection Error:", err);
    else console.log("Connected to SQLite Database.");
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            verify_token TEXT UNIQUE,
            school TEXT,
            name TEXT,
            program TEXT,
            valid_through TEXT,
            photo_url TEXT,
            status TEXT DEFAULT 'ACTIVE STUDENT',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Configure Multer for Photo Uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, 'photo_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Authentication Middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Access Denied. No token provided.' });

    try {
        const verified = jwt.verify(token.split(" ")[1], SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid Token' });
    }
};

// Admin Login Endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '8h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Incorrect Password' });
});

// Create Student & Generate QR Code
app.post('/api/students', authenticateAdmin, upload.single('photo'), async (req, res) => {
    const { school, name, program, validThrough, studentId } = req.body;
    const verifyToken = crypto.randomBytes(12).toString('hex'); // Unguessable verification token
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.png';

    const host = req.get('host');
    const protocol = req.protocol;
    const verifyUrl = `${protocol}://${host}/verify.html?token=${verifyToken}`;

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });

        const stmt = db.prepare(`
            INSERT INTO students (id, verify_token, school, name, program, valid_through, photo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(studentId, verifyToken, school, name, program, validThrough, photoUrl, function(err) {
            if (err) {
                return res.status(400).json({ error: 'Student ID already exists.' });
            }
            res.json({
                student: { id: studentId, verifyToken, school, name, program, validThrough, photoUrl },
                qrCodeDataUrl,
                verifyUrl
            });
        });
        stmt.finalize();
    } catch (err) {
        res.status(500).json({ error: 'Server Error Generating ID' });
    }
});

// Public Verification Endpoint
app.get('/api/verify/:token', (req, res) => {
    const { token } = req.params;
    db.get(`SELECT school, name, program, id, valid_through, photo_url, status FROM students WHERE verify_token = ?`, [token], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ valid: false, message: 'Invalid or Fraudulent ID' });
        }
        res.json({ valid: true, student: row });
    });
});

// Ensure Uploads Directory Exists
const fs = require('fs');
if (!fs.existsSync('./public/uploads')) {
    fs.mkdirSync('./public/uploads', { recursive: true });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
