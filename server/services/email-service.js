// Backend service for sending emails
const nodemailer = require("nodemailer")

// Create a transporter object
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

// Send email to mentor
const sendMentorEmail = async (mentor, student, meetingDetails) => {
  const transporter = createTransporter()

  // Format date and time for email
  const formattedDate = new Date(meetingDetails.date).toLocaleDateString()

  // Create student details object (excluding password and email)
  const studentDetails = {
    name: `${student.firstName} ${student.lastName || ""}`,
    age: student.age,
    phoneNumber: student.phoneNumber,
    educationLevel: student.educationLevel,
    currentSchool: student.currentSchool,
    goals: student.goals,
    areasOfInterest: student.areasOfInterest,
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: mentor.email,
    subject: `New Meeting Request from ${student.firstName} ${student.lastName || ""}`,
    html: `
      <h2>New Meeting Request</h2>
      <p>You have a new meeting request from ${student.firstName} ${student.lastName || ""}.</p>
      
      <h3>Meeting Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${meetingDetails.time}</li>
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

  return transporter.sendMail(mailOptions)
}

// Send email to student
const sendStudentEmail = async (student, mentor, meetingDetails) => {
  const transporter = createTransporter()

  // Format date and time for email
  const formattedDate = new Date(meetingDetails.date).toLocaleDateString()

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: `Meeting Request Confirmation with ${mentor.firstName} ${mentor.lastName}`,
    html: `
      <h2>Meeting Request Confirmation</h2>
      <p>Your meeting request with ${mentor.firstName} ${mentor.lastName} has been sent.</p>
      
      <h3>Meeting Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${meetingDetails.time}</li>
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

  return transporter.sendMail(mailOptions)
}

module.exports = {
  sendMentorEmail,
  sendStudentEmail,
}

