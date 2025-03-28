// Backend route for meetings
const express = require("express")
const router = express.Router()
const Mentor = require("../models/Mentor")
const Student = require("../models/Student")
const Meeting = require("../models/Meeting")
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
      status: "pending", // Changed to pending for mentor approval
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
      message: "Meeting request sent successfully",
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
      status: { $in: ["scheduled", "pending"] }, // Get active or pending meetings
    })

    res.status(200).json({ meeting })
  } catch (err) {
    console.error("Error fetching meeting:", err)
    res.status(500).json({ error: err.message || "An error occurred while fetching the meeting" })
  }
})

// Get upcoming meetings for a student
router.get("/student/:studentId/upcoming", async (req, res) => {
  try {
    const { studentId } = req.params

    // Find the next upcoming meeting for this student
    const meeting = await Meeting.findOne({
      studentId,
      status: "scheduled",
      date: { $gte: new Date().toISOString().split("T")[0] }, // Date is today or in the future
    }).sort({ date: 1, time: 1 }) // Sort by date and time ascending

    if (!meeting) {
      return res.status(200).json({ meeting: null })
    }

    // Get mentor info
    const mentor = await Mentor.findById(meeting.mentorId)

    // Add mentor name to meeting object
    const meetingWithMentorName = {
      ...meeting.toObject(),
      mentorName: mentor ? `${mentor.firstName} ${mentor.lastName}` : "Unknown Mentor",
    }

    res.status(200).json({ meeting: meetingWithMentorName })
  } catch (err) {
    console.error("Error fetching upcoming meetings:", err)
    res.status(500).json({ error: err.message || "An error occurred while fetching upcoming meetings" })
  }
})

// Get all meetings for a mentor
router.get("/mentor/:mentorId", async (req, res) => {
  try {
    const { mentorId } = req.params

    const meetings = await Meeting.find({ mentorId })

    res.status(200).json({ meetings })
  } catch (err) {
    console.error("Error fetching mentor meetings:", err)
    res.status(500).json({ error: err.message || "An error occurred while fetching mentor meetings" })
  }
})

// Accept a meeting request
router.post("/accept/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params
    const { mentorId } = req.body

    // Find and update meeting
    const meeting = await Meeting.findById(meetingId)

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" })
    }

    if (meeting.mentorId.toString() !== mentorId) {
      return res.status(403).json({ error: "Not authorized to accept this meeting" })
    }

    meeting.status = "scheduled"
    await meeting.save()

    // Fetch mentor and student
    const mentor = await Mentor.findById(mentorId)
    const student = await Student.findById(meeting.studentId)

    if (!mentor || !student) {
      return res.status(404).json({ error: "Mentor or student not found" })
    }

    // Send acceptance emails
    await sendAcceptanceEmails(student, mentor, meeting)

    res.status(200).json({
      message: "Meeting accepted successfully",
      meeting,
    })
  } catch (err) {
    console.error("Error accepting meeting:", err)
    res.status(500).json({ error: err.message || "An error occurred while accepting the meeting" })
  }
})

// Reject a meeting request
router.post("/reject/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params
    const { mentorId, rejectionReason } = req.body

    // Find and update meeting
    const meeting = await Meeting.findById(meetingId)

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" })
    }

    if (meeting.mentorId.toString() !== mentorId) {
      return res.status(403).json({ error: "Not authorized to reject this meeting" })
    }

    meeting.status = "rejected"
    meeting.cancellationReason = rejectionReason || "Mentor is unavailable"
    meeting.cancelledAt = new Date()
    await meeting.save()

    // Fetch mentor and student
    const mentor = await Mentor.findById(mentorId)
    const student = await Student.findById(meeting.studentId)

    if (!mentor || !student) {
      return res.status(404).json({ error: "Mentor or student not found" })
    }

    // Send rejection emails
    await sendRejectionEmails(student, mentor, meeting, rejectionReason)

    res.status(200).json({
      message: "Meeting rejected successfully",
      meeting,
    })
  } catch (err) {
    console.error("Error rejecting meeting:", err)
    res.status(500).json({ error: err.message || "An error occurred while rejecting the meeting" })
  }
})

// Complete a meeting
router.post("/complete/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params
    const { mentorId, duration } = req.body

    // Find and update meeting
    const meeting = await Meeting.findById(meetingId)

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" })
    }

    if (meeting.mentorId.toString() !== mentorId) {
      return res.status(403).json({ error: "Not authorized to complete this meeting" })
    }

    meeting.status = "completed"
    meeting.actualDuration = duration || meeting.duration
    await meeting.save()

    res.status(200).json({
      message: "Meeting completed successfully",
      meeting,
    })
  } catch (err) {
    console.error("Error completing meeting:", err)
    res.status(500).json({ error: err.message || "An error occurred while completing the meeting" })
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

// Helper function to send acceptance emails
const sendAcceptanceEmails = async (student, mentor, meeting) => {
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

  // Send email to student
  const studentMailOptions = {
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: `Meeting Accepted: ${mentor.firstName} ${mentor.lastName}`,
    html: `
      <h2>Meeting Accepted</h2>
      <p>Good news! ${mentor.firstName} ${mentor.lastName} has accepted your meeting request.</p>
      
      <h3>Meeting Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${meeting.time}</li>
        <li><strong>Duration:</strong> ${meeting.duration} minutes</li>
        <li><strong>Topic:</strong> ${meeting.topic}</li>
      </ul>
      
      <p>You will be able to join the video call 15 minutes before the scheduled time.</p>
      <p>We'll send you a reminder 30 minutes before the meeting.</p>
    `,
  }

  // Send email to mentor
  const mentorMailOptions = {
    from: process.env.EMAIL_USER,
    to: mentor.email,
    subject: `Meeting Confirmation with ${student.firstName} ${student.lastName}`,
    html: `
      <h2>Meeting Confirmation</h2>
      <p>You have accepted a meeting request from ${student.firstName} ${student.lastName}.</p>
      
      <h3>Meeting Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${meeting.time}</li>
        <li><strong>Duration:</strong> ${meeting.duration} minutes</li>
        <li><strong>Topic:</strong> ${meeting.topic}</li>
      </ul>
      
      <p>You will be able to host the video call 15 minutes before the scheduled time.</p>
    `,
  }

  // Send emails
  await transporter.sendMail(studentMailOptions)
  await transporter.sendMail(mentorMailOptions)
}

// Helper function to send rejection emails
const sendRejectionEmails = async (student, mentor, meeting, reason) => {
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

  // Send email to student
  const studentMailOptions = {
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: `Meeting Request Declined`,
    html: `
      <h2>Meeting Request Declined</h2>
      <p>${mentor.firstName} ${mentor.lastName} is unable to accept your meeting request for ${formattedDate} at ${meeting.time}.</p>
      
      <h3>Reason:</h3>
      <p>${reason || "The mentor is unavailable at this time."}</p>
      
      <p>Please try booking another time or connecting with a different mentor.</p>
    `,
  }

  // Send email to mentor
  const mentorMailOptions = {
    from: process.env.EMAIL_USER,
    to: mentor.email,
    subject: `Meeting Rejection Confirmation`,
    html: `
      <h2>Meeting Rejection Confirmation</h2>
      <p>You have declined a meeting request from ${student.firstName} ${student.lastName} for ${formattedDate} at ${meeting.time}.</p>
      
      <h3>Reason Provided:</h3>
      <p>${reason || "No specific reason provided."}</p>
    `,
  }

  // Send emails
  await transporter.sendMail(studentMailOptions)
  await transporter.sendMail(mentorMailOptions)
}

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

// Send reminder email 30 minutes before meeting
const sendReminderEmail = async (meeting) => {
  try {
    // Fetch mentor and student
    const mentor = await Mentor.findById(meeting.mentorId)
    const student = await Student.findById(meeting.studentId)

    if (!mentor || !student) {
      console.error("Mentor or student not found for reminder")
      return
    }

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

    // Send email to student
    const studentMailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: `Reminder: Meeting with ${mentor.firstName} ${mentor.lastName} in 30 minutes`,
      html: `
        <h2>Meeting Reminder</h2>
        <p>Your meeting with ${mentor.firstName} ${mentor.lastName} is scheduled to start in 30 minutes.</p>
        
        <h3>Meeting Details:</h3>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${meeting.time}</li>
          <li><strong>Duration:</strong> ${meeting.duration} minutes</li>
          <li><strong>Topic:</strong> ${meeting.topic}</li>
        </ul>
        
        <p>You can join the video call 15 minutes before the scheduled time.</p>
        <p>Log in to your MentorConnect account to join the call.</p>
      `,
    }

    // Send email to mentor
    const mentorMailOptions = {
      from: process.env.EMAIL_USER,
      to: mentor.email,
      subject: `Reminder: Meeting with ${student.firstName} ${student.lastName} in 30 minutes`,
      html: `
        <h2>Meeting Reminder</h2>
        <p>Your meeting with ${student.firstName} ${student.lastName} is scheduled to start in 30 minutes.</p>
        
        <h3>Meeting Details:</h3>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${meeting.time}</li>
          <li><strong>Duration:</strong> ${meeting.duration} minutes</li>
          <li><strong>Topic:</strong> ${meeting.topic}</li>
        </ul>
        
        <p>You can host the video call 15 minutes before the scheduled time.</p>
        <p>Log in to your MentorConnect account to host the call.</p>
      `,
    }

    // Send emails
    await transporter.sendMail(studentMailOptions)
    await transporter.sendMail(mentorMailOptions)

    console.log(`Reminder sent for meeting ${meeting._id}`)
  } catch (err) {
    console.error("Error sending reminder:", err)
  }
}

// Schedule reminders for upcoming meetings
const scheduleReminders = async () => {
  try {
    // Get current date and time
    const now = new Date()

    // Get meetings that are scheduled for the next hour
    const meetings = await Meeting.find({
      status: "scheduled",
      date: now.toISOString().split("T")[0], // Today's date
    })

    for (const meeting of meetings) {
      // Calculate meeting time
      const [hours, minutes] = meeting.time.split(":").map(Number)
      const meetingTime = new Date(meeting.date)
      meetingTime.setHours(hours, minutes, 0, 0)

      // Calculate time difference in minutes
      const timeDiff = (meetingTime - now) / (1000 * 60)

      // If meeting is between 29-31 minutes away, send reminder
      if (timeDiff >= 29 && timeDiff <= 31) {
        await sendReminderEmail(meeting)
      }
    }
  } catch (err) {
    console.error("Error scheduling reminders:", err)
  }
}

// Run reminder scheduler every minute
setInterval(scheduleReminders, 60000)

module.exports = router

