const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB error:', err));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

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

// API Routes
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/students/:token', '/api/verify/:token'], async (req, res) => {
  try {
    const student = await Student.findOne({ token: req.params.token });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body;
    if (!studentData.token) return res.status(400).json({ success: false, error: 'Missing token' });

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

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to prevent HTML overrides on API calls
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
