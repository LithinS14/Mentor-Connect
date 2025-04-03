"use client"

import { useState, useEffect } from "react"
import "./MeetingDialog.css"
import "./ErrorStyles.css"

const MeetingDialog = ({ mentor, onClose, onMeetingBooked }) => {
  const [meetingDate, setMeetingDate] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingDuration, setMeetingDuration] = useState("30")
  const [meetingTopic, setMeetingTopic] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [studentInfo, setStudentInfo] = useState(null)
  const [minTime, setMinTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")

  // Get student info from localStorage and set up current date/time
  useEffect(() => {
    const studentId = localStorage.getItem("studentId")
    const studentEmail = localStorage.getItem("studentEmail")
    const studentProfileStr = localStorage.getItem("studentProfile")

    // Set current date and time
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    setCurrentDate(today)

    // Calculate minimum time (current time + 30 minutes)
    const minTimeDate = new Date(now.getTime() + 30 * 60000)
    const hours = minTimeDate.getHours().toString().padStart(2, "0")
    const minutes = minTimeDate.getMinutes().toString().padStart(2, "0")
    setMinTime(`${hours}:${minutes}`)

    if (studentProfileStr) {
      setStudentInfo(JSON.parse(studentProfileStr))
    } else if (studentId && studentEmail) {
      fetchStudentProfile(studentId)
    }
  }, [])

  const fetchStudentProfile = async (studentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/studentHome/student/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setStudentInfo(data)
        localStorage.setItem("studentProfile", JSON.stringify(data))
      } else {
        console.error("Failed to fetch student profile")
      }
    } catch (err) {
      console.error("Error fetching student profile:", err)
    }
  }

  // Get today's date as the minimum selectable date
  const minDate = currentDate
  // Get date 30 days from now as the maximum selectable date
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  const handleDateChange = (e) => {
    const selectedDate = e.target.value
    setMeetingDate(selectedDate)

    // If selected date is today, set the minimum time to current time + 30 minutes
    if (selectedDate === currentDate) {
      setMeetingTime("") // Reset time when date changes
    } else {
      // For future dates, no time restrictions
      setMinTime("00:00")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!studentInfo) {
        throw new Error("Student information not available. Please log in again.")
      }

      const studentId = localStorage.getItem("studentId")
      if (!studentId) {
        throw new Error("You must be logged in to book a meeting")
      }

      // Additional validation for same-day bookings
      if (meetingDate === currentDate) {
        const now = new Date()
        const selectedDateTime = new Date(`${meetingDate}T${meetingTime}`)
        const minBookingTime = new Date(now.getTime() + 30 * 60000) // Current time + 30 minutes

        if (selectedDateTime < minBookingTime) {
          setError("Please select a time at least 30 minutes from now")
          setIsSubmitting(false)
          return
        }
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

      setSuccess(true)
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
            <button
              className="close-button"
              onClick={() => setSuccess(false)}
              style={{ float: "right", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
            >
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
                onChange={handleDateChange}
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
                min={meetingDate === currentDate ? minTime : undefined}
                required
              />
              {meetingDate === currentDate && (
                <p className="time-hint">
                  <strong>Note:</strong> Earliest available time: {minTime} (30 minutes from now)
                </p>
              )}
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

