const express = require("express");
const Student = require("../models/Student");
const router = express.Router();

// Student Sign Up section
router.post("/signup", async (req, res) => {
  const {
    firstName,
    middleName,
    email,
    password,
    age,
    phoneNumber,
    educationLevel,
    currentSchool,
    goals,
    areasOfInterest,
    otherInterest
  } = req.body;

  try {
    const student = new Student({
      firstName,
      middleName,
      email,
      password,
      age,
      phoneNumber,
      educationLevel,
      currentSchool,
      goals,
      areasOfInterest,
      otherInterest
    });

    await student.save();
    res.status(201).json({ message: "Student registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Student Sign In Section
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });

    if (!student || student.password !== password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ 
      message: "Student signed in successfully",
      studentId: student._id // Return the student ID
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;