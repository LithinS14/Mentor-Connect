const express = require("express")
const router = express.Router()
const Student = require("../models/Student")
const Mentor = require("../models/Mentor")
const nodemailer = require("nodemailer")

// Fetch student data by ID
router.get("/student/:id", async (req, res) => {
  try {
    console.log(`Attempting to fetch student with ID: ${req.params.id}`)

    // Validate the ID format first
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid student ID format",
        success: false,
        fallbackData: {
          firstName: "Unknown",
          lastName: "Student",
          educationLevel: "Not available",
          currentSchool: "Not available",
          areasOfInterest: ["Not available"],
        },
      })
    }

    const student = await Student.findById(req.params.id)

    if (!student) {
      console.log(`Student not found with ID: ${req.params.id}`)
      return res.status(404).json({
        message: "Student not found",
        success: false,
        fallbackData: {
          firstName: "Unknown",
          lastName: "Student",
          educationLevel: "Not available",
          currentSchool: "Not available",
          areasOfInterest: ["Not available"],
        },
      })
    }

    // Return student data without sensitive information
    const safeStudentData = {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName || "",
      email: student.email,
      age: student.age,
      phoneNumber: student.phoneNumber,
      educationLevel: student.educationLevel,
      currentSchool: student.currentSchool,
      goals: student.goals,
      areasOfInterest: student.areasOfInterest,
    }

    res.json(safeStudentData)
  } catch (err) {
    console.error(`Error fetching student with ID ${req.params.id}:`, err)
    // Check if error is due to invalid ObjectId format
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res.status(400).json({
        message: "Invalid student ID format",
        success: false,
        fallbackData: {
          firstName: "Unknown",
          lastName: "Student",
          educationLevel: "Not available",
          currentSchool: "Not available",
          areasOfInterest: ["Not available"],
        },
      })
    }
    res.status(500).json({
      message: err.message,
      success: false,
      fallbackData: {
        firstName: "Unknown",
        lastName: "Student",
        educationLevel: "Not available",
        currentSchool: "Not available",
        areasOfInterest: ["Not available"],
      },
    })
  }
})

// Fetch all mentors
router.get("/mentors", async (req, res) => {
  try {
    const mentors = await Mentor.find()
    res.json(mentors)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Book a meeting with a mentor
router.post("/book-meeting", async (req, res) => {
  try {
    const { mentorId, studentId, meetingDetails } = req.body

    // Validate required fields
    if (!mentorId || !studentId || !meetingDetails) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Fetch mentor and student from database
    const mentor = await Mentor.findById(mentorId)
    const student = await Student.findById(studentId)

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" })
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services like SendGrid, etc.
      auth: {
        user: process.env.EMAIL_USER, // Add this to your .env file
        pass: process.env.EMAIL_PASSWORD, // Add this to your .env file
      },
    })

    // Create student details object (excluding password and email)
    const studentDetails = {
      name: `${student.firstName} ${student.lastName}`,
      age: student.age,
      phoneNumber: student.phoneNumber,
      educationLevel: student.educationLevel,
      currentSchool: student.currentSchool,
      goals: student.goals,
      areasOfInterest: student.areasOfInterest,
    }

    // Format date and time for email
    const formattedDate = new Date(meetingDetails.date).toLocaleDateString()
    const formattedTime = meetingDetails.time

    // Send email to mentor
    const mentorMailOptions = {
      from: process.env.EMAIL_USER,
      to: mentor.email,
      subject: `New Meeting Request from ${student.firstName} ${student.lastName}`,
      html: `
        <h2>New Meeting Request</h2>
        <p>You have a new meeting request from ${student.firstName} ${student.lastName}.</p>
        
        <h3>Meeting Details:</h3>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Duration:</strong> ${meetingDetails.duration} minutes</li>
          <li><strong>Topic:</strong> ${meetingDetails.topic}</li>
        </ul>
        
        <h3>Student Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${studentDetails.name}</li>
          <li><strong>Age:</strong> ${studentDetails.age}</li>
          <li><strong>Phone:</strong> ${studentDetails.phoneNumber}</li>
          <li><strong>Education:</strong> ${studentDetails.educationLevel}</li>
          <li><strong>School/University:</strong> ${studentDetails.currentSchool}</li>
          <li><strong>Areas of Interest:</strong> ${studentDetails.areasOfInterest.join(", ")}</li>
        </ul>
        
        <h3>Student Goals:</h3>
        <p>${studentDetails.goals}</p>
        
        <p>Please respond to the student to confirm this meeting.</p>
      `,
    }

    // Send email to student
    const studentMailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: `Meeting Request Confirmation with ${mentor.firstName} ${mentor.lastName}`,
      html: `
        <h2>Meeting Request Confirmation</h2>
        <p>Your meeting request with ${mentor.firstName} ${mentor.lastName} has been sent.</p>
        
        <h3>Meeting Details:</h3>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Duration:</strong> ${meetingDetails.duration} minutes</li>
          <li><strong>Topic:</strong> ${meetingDetails.topic}</li>
        </ul>
        
        <p>The mentor will contact you soon to confirm this meeting.</p>
        
        <h3>Mentor Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${mentor.firstName} ${mentor.lastName}</li>
          <li><strong>Expertise:</strong> ${mentor.areasOfInterest ? mentor.areasOfInterest.join(", ") : "Various fields"}</li>
        </ul>
      `,
    }

    // Send emails
    await transporter.sendMail(mentorMailOptions)
    await transporter.sendMail(studentMailOptions)

    // Return success response
    res.status(200).json({
      message: "Meeting request sent successfully",
      meetingDetails: {
        mentor: `${mentor.firstName} ${mentor.lastName}`,
        date: formattedDate,
        time: formattedTime,
        duration: meetingDetails.duration,
        topic: meetingDetails.topic,
      },
    })
  } catch (err) {
    console.error("Error booking meeting:", err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

