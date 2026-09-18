const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGO_URI || "YOUR_MONGODB_URI_HERE";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Cloud"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Student Database Schema
const studentSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  name: String,
  program: String,
  idNumber: String,
  validThrough: String,
  status: String,
  photoUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// GET API: Verify Student Token (Global Access)
app.get('/api/verify/:token', async (req, res) => {
  try {
    const student = await Student.findOne({ token: req.params.token });
    if (!student) {
      return res.status(404).json({ success: false, message: "Unverified / Removed" });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// GET API: List All Students for Admin Dashboard
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({});
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// POST API: Add/Update Student Record
app.post('/api/students', async (req, res) => {
  try {
    const { token, name, program, idNumber, validThrough, status, photoUrl } = req.body;
    const student = await Student.findOneAndUpdate(
      { token },
      { name, program, idNumber, validThrough, status, photoUrl },
      { upsert: true, new: true }
    );
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to save student" });
  }
});

// DELETE API: Remove Student Record
app.delete('/api/students/:token', async (req, res) => {
  try {
    await Student.deleteOne({ token: req.params.token });
    res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Delete failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TerraHub Server active on port ${PORT}`));
