const express = require("express")
const Mentor = require("../models/Mentor")
const router = express.Router()

// Mentor Sign Up
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, profilePicture, yearsOfExperience, areasOfInterest, bio } = req.body

  try {
    // Check if mentor already exists
    const existingMentor = await Mentor.findOne({ email })
    if (existingMentor) {
      return res.status(400).json({ error: "Email already in use" })
    }

    // Create new mentor with plain password
    const mentor = new Mentor({
      firstName,
      lastName,
      email,
      password, // Store password directly without hashing
      profilePicture,
      yearsOfExperience,
      areasOfInterest,
      bio,
    })

    await mentor.save()
    res.status(201).json({ message: "Mentor registered successfully" })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Mentor Sign In
router.post("/signin", async (req, res) => {
  const { email, password } = req.body

  try {
    const mentor = await Mentor.findOne({ email })

    if (!mentor || mentor.password !== password) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    res.status(200).json({
      message: "Mentor signed in successfully",
      mentorId: mentor._id,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Get mentor by ID
router.get("/:id", async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" })
    }

    // Don't send password
    const mentorData = {
      _id: mentor._id,
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      email: mentor.email,
      profilePicture: mentor.profilePicture,
      yearsOfExperience: mentor.yearsOfExperience,
      areasOfInterest: mentor.areasOfInterest,
      bio: mentor.bio,
    }

    res.json(mentorData)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

