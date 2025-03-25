// Backend route for meetings
const express = require("express")
const router = express.Router()
const Mentor = require("../models/Mentor")
const Student = require("../models/Student")
const Meeting = require("../models/Meeting") // You'll need to create this model
const { sendMentorEmail, sendStudentEmail } = require("../services/email-service")
const nodemailer = require("nodemailer")

// Book a meeting
router.post("/book", async (req, res) => {
  try {
    const { mentorId, studentId, meetingDate, meetingTime, meetingDuration, meetingTopic } = req.body

    // Validate required fields
    if (!mentorId || !studentId || !meetingDate || !meetingTime || !meetingDuration || !meetingTopic) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Fetch mentor and student from database
    const mentor = await Mentor.findById(mentorId)
    const student = await Student.findById(studentId)

    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" })
    }

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    // Create meeting in database
    const newMeeting = new Meeting({
      mentorId,
      studentId,
      date: meetingDate,
      time: meetingTime,
      duration: meetingDuration,
      topic: meetingTopic,
      status: "scheduled",
    })

    await newMeeting.save()

    // Create meeting details object
    const meetingDetails = {
      _id: newMeeting._id,
      date: meetingDate,
      time: meetingTime,
      duration: meetingDuration,
      topic: meetingTopic,
      mentorId,
      studentId,
    }

    // Send emails to mentor and student
    await Promise.all([
      sendMentorEmail(mentor, student, meetingDetails),
      sendStudentEmail(student, mentor, meetingDetails),
    ])

    // Return success response
    res.status(200).json({
      message: "Meeting booked successfully",
      meetingDetails,
    })
  } catch (err) {
    console.error("Error booking meeting:", err)
    res.status(500).json({ error: err.message || "An error occurred while booking the meeting" })
  }
})

// Get meetings for a student with a specific mentor
router.get("/student/:studentId/mentor/:mentorId", async (req, res) => {
  try {
    const { studentId, mentorId } = req.params

    const meeting = await Meeting.findOne({
      studentId,
      mentorId,
      status: "scheduled", // Only get active meetings
    })

    res.status(200).json({ meeting })
  } catch (err) {
    console.error("Error fetching meeting:", err)
    res.status(500).json({ error: err.message || "An error occurred while fetching the meeting" })
  }
})

// Cancel a meeting
router.post("/cancel/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params
    const { cancellationReason, studentId, mentorId } = req.body

    // Validate required fields
    if (!meetingId || !cancellationReason) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Find and update meeting
    const meeting = await Meeting.findById(meetingId)

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" })
    }

    meeting.status = "cancelled"
    meeting.cancellationReason = cancellationReason
    meeting.cancelledAt = new Date()

    await meeting.save()

    // Fetch mentor and student
    const mentor = await Mentor.findById(mentorId)
    const student = await Student.findById(studentId)

    if (!mentor || !student) {
      return res.status(404).json({ error: "Mentor or student not found" })
    }

    // Send cancellation emails
    await sendCancellationEmails(student, mentor, meeting, cancellationReason)

    res.status(200).json({
      message: "Meeting cancelled successfully",
      meeting,
    })
  } catch (err) {
    console.error("Error cancelling meeting:", err)
    res.status(500).json({ error: err.message || "An error occurred while cancelling the meeting" })
  }
})

// Helper function to send cancellation emails
const sendCancellationEmails = async (student, mentor, meeting, reason) => {
  // Create email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  // Format date for email
  const formattedDate = new Date(meeting.date).toLocaleDateString()

  // Send email to mentor
  const mentorMailOptions = {
    from: process.env.EMAIL_USER,
    to: mentor.email,
    subject: `Meeting Cancellation: ${student.firstName} ${student.lastName}`,
    html: `
      <h2>Meeting Cancellation Notice</h2>
      <p>Your meeting with ${student.firstName} ${student.lastName} scheduled for ${formattedDate} at ${meeting.time} has been cancelled.</p>
      
      <h3>Cancellation Reason:</h3>
      <p>${reason}</p>
      
      <h3>Meeting Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${meeting.time}</li>
        <li><strong>Duration:</strong> ${meeting.duration} minutes</li>
        <li><strong>Topic:</strong> ${meeting.topic}</li>
      </ul>
    `,
  }

  // Send email to student
  const studentMailOptions = {
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: `Meeting Cancellation Confirmation`,
    html: `
      <h2>Meeting Cancellation Confirmation</h2>
      <p>Your meeting with ${mentor.firstName} ${mentor.lastName} scheduled for ${formattedDate} at ${meeting.time} has been cancelled.</p>
      
      <h3>Cancellation Reason:</h3>
      <p>${reason}</p>
      
      <h3>Meeting Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${meeting.time}</li>
        <li><strong>Duration:</strong> ${meeting.duration} minutes</li>
        <li><strong>Topic:</strong> ${meeting.topic}</li>
      </ul>
    `,
  }

  // Send emails
  await transporter.sendMail(mentorMailOptions)
  await transporter.sendMail(studentMailOptions)
}

module.exports = router

