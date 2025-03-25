"use client"

import { useState, useEffect } from "react"
import "./MeetingDialog.css"

const MeetingDialog = ({ mentor, onClose, onMeetingBooked }) => {
  const [meetingDate, setMeetingDate] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingDuration, setMeetingDuration] = useState("30")
  const [meetingTopic, setMeetingTopic] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [studentInfo, setStudentInfo] = useState(null)

  // Get student info from localStorage
  useEffect(() => {
    const studentId = localStorage.getItem("studentId")
    const studentEmail = localStorage.getItem("studentEmail")
    const studentProfileStr = localStorage.getItem("studentProfile")

    if (studentProfileStr) {
      // If we have the complete profile, use it
      setStudentInfo(JSON.parse(studentProfileStr))
    } else if (studentId && studentEmail) {
      // If we only have ID and email, fetch the profile
      fetchStudentProfile(studentId)
    }
  }, [])

  const fetchStudentProfile = async (studentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/studentHome/student/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setStudentInfo(data)
        // Store for future use
        localStorage.setItem("studentProfile", JSON.stringify(data))
      } else {
        console.error("Failed to fetch student profile")
      }
    } catch (err) {
      console.error("Error fetching student profile:", err)
    }
  }

  // Get tomorrow's date as the minimum selectable date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  // Get date 30 days from now as the maximum selectable date
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Check if student info is available
      if (!studentInfo) {
        throw new Error("Student information not available. Please log in again.")
      }

      const studentId = localStorage.getItem("studentId")
      if (!studentId) {
        throw new Error("You must be logged in to book a meeting")
      }

      const meetingData = {
        mentorId: mentor._id,
        studentId: studentId,
        meetingDate,
        meetingTime,
        meetingDuration,
        meetingTopic,
      }

      const response = await fetch("http://localhost:5000/api/meetings/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to book meeting")
      }

      setSuccess(true) // Show success message

      // Notify parent component about the booked meeting
      if (onMeetingBooked) {
        onMeetingBooked(data.meetingDetails)
      }
    } catch (err) {
      console.error("Error booking meeting:", err)
      setError(err.message || "An error occurred while booking the meeting")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="meeting-dialog-overlay">
      <div className="meeting-dialog">
        <div className="meeting-dialog-header">
          <h2>
            Book a Meeting with {mentor.firstName} {mentor.lastName}
          </h2>
          <p className="mentor-expertise">{mentor.areasOfInterest && mentor.areasOfInterest.join(", ")}</p>
        </div>

        {success ? (
          <div className="success-message">
            <button className="close-button" onClick={() => setSuccess(false)} style={{ float: "right", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>
              ×
            </button>
            <h3>Meeting Booked Successfully!</h3>
            <p>
              Your meeting with {mentor.firstName} {mentor.lastName} has been scheduled for{" "}
              {new Date(meetingDate).toLocaleDateString()} at {meetingTime}.
            </p>
            <p>You will receive a confirmation email shortly with meeting details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="meeting-form">
            <div className="form-group">
              <label htmlFor="meeting-date">Date</label>
              <input
                type="date"
                id="meeting-date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                min={minDate}
                max={maxDateStr}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meeting-time">Time</label>
              <input
                type="time"
                id="meeting-time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meeting-duration">Duration</label>
              <select
                id="meeting-duration"
                value={meetingDuration}
                onChange={(e) => setMeetingDuration(e.target.value)}
                required
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="meeting-topic">What would you like to discuss?</label>
              <textarea
                id="meeting-topic"
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss in this meeting..."
                rows="4"
                required
              ></textarea>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="meeting-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="book-button" disabled={isSubmitting}>
                {isSubmitting ? "Booking..." : "Book Meeting"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default MeetingDialog