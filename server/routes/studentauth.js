const express = require("express")
const bcrypt = require("bcrypt")
const Student = require("../models/Student")
const router = express.Router()

// Student Sign Up section
router.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    age,
    phoneNumber,
    educationLevel,
    currentSchool,
    goals,
    areasOfInterest,
    otherInterest,
  } = req.body

  try {
    // Check if student already exists
    const existingStudent = await Student.findOne({ email })
    if (existingStudent) {
      return res.status(400).json({ error: "Email already in use" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const student = new Student({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      age,
      phoneNumber,
      educationLevel,
      currentSchool,
      goals,
      areasOfInterest,
      otherInterest,
    })

    await student.save()
    res.status(201).json({ message: "Student registered successfully" })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Student Sign In Section
router.post("/signin", async (req, res) => {
  const { email, password } = req.body

  try {
    const student = await Student.findOne({ email })

    if (!student) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password)
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    res.status(200).json({
      message: "Student signed in successfully",
      studentId: student._id, // Return the student ID
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router

