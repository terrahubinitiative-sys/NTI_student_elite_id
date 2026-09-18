const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Student Schema
const studentSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  name: String,
  program: String,
  idNumber: String,
  validThrough: String,
  status: String,
  photoUrl: String
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

// --- API ROUTES FIRST ---

// GET: All students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Single student by token (Handles both /api/students/:token AND /api/verify/:token)
app.get(['/api/students/:token', '/api/verify/:token'], async (req, res) => {
  try {
    const student = await Student.findOne({ token: req.params.token });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Save or update student
app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body;
    if (!studentData.token) {
      return res.status(400).json({ success: false, error: 'Missing token' });
    }

    const student = await Student.findOneAndUpdate(
      { token: studentData.token },
      studentData,
      { upsert: true, new: true }
    );

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- STATIC FILES AFTER API ROUTES ---
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
