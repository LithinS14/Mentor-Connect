"use client"

import { useState, useEffect } from "react"
import "./MeetingDetailsDialog.css"

const MeetingDetailsDialog = ({ meeting = {}, mentor = {}, onClose, onMeetingCancelled }) => {
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isMentor, setIsMentor] = useState(false)

  useEffect(() => {
    // Check if the current user is a mentor or student
    const mentorId = localStorage.getItem("mentorId")
    if (mentorId && mentorId === meeting.mentorId) {
      setIsMentor(true)
    }
  }, [meeting.mentorId])

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date not available"

    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    try {
      return new Date(dateString).toLocaleDateString(undefined, options)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const handleCancelMeeting = async (e) => {
    e.preventDefault()

    if (!cancellationReason.trim()) {
      setError("Please provide a reason for cancellation")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const requestBody = isMentor
        ? {
            cancellationReason,
            mentorId: meeting.mentorId,
            studentId: meeting.studentId,
          }
        : {
            cancellationReason,
            studentId: meeting.studentId,
            mentorId: meeting.mentorId,
          }

      const response = await fetch(`http://localhost:5000/api/meetings/cancel/${meeting._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        credentials: "omit", // Don't send credentials
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel meeting")
      }

      setSuccess(true)

      // Notify parent component that meeting was cancelled
      setTimeout(() => {
        if (onMeetingCancelled) {
          onMeetingCancelled()
        }
        onClose()
      }, 3000)
    } catch (err) {
      console.error("Error cancelling meeting:", err)
      setError(err.message || "An error occurred while cancelling the meeting")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="meeting-details-dialog">
      <div className="meeting-details-header">
        <h2>Meeting Details</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {success ? (
        <div className="success-message">
          <h3>Meeting Cancelled Successfully</h3>
          <p>
            {isMentor
              ? `Your meeting with the student has been cancelled.`
              : `Your meeting with ${mentor.firstName} ${mentor.lastName} has been cancelled.`}
          </p>
          <p>Both parties have been notified via email.</p>
        </div>
      ) : (
        <div className="meeting-details-content">
          <div className="meeting-info-section">
            <h3>Meeting Information</h3>
            <div className="info-grid">
              {isMentor ? (
                <div className="info-item">
                  <span className="info-label">Student:</span>
                  <span className="info-value">{meeting.studentName || "Student"}</span>
                </div>
              ) : (
                <div className="info-item">
                  <span className="info-label">Mentor:</span>
                  <span className="info-value">
                    {mentor.firstName} {mentor.lastName}
                  </span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Date:</span>
                <span className="info-value">{formatDate(meeting.date)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Time:</span>
                <span className="info-value">{meeting.time}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Duration:</span>
                <span className="info-value">{meeting.duration} minutes</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`info-value status-${meeting.status || "unknown"}`}>
                  {meeting.status ? meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1) : "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <div className="meeting-topic-section">
            <h3>Discussion Topic</h3>
            <p className="meeting-topic">{meeting.topic}</p>
          </div>

          {meeting.cancellationReason && (
            <div className="cancellation-reason-section">
              <h3>Cancellation Reason</h3>
              <p className="cancellation-reason">{meeting.cancellationReason}</p>
            </div>
          )}

          {showCancelForm ? (
            <div className="cancel-meeting-section">
              <h3>Cancel Meeting</h3>
              <form onSubmit={handleCancelMeeting}>
                <div className="form-group">
                  <label htmlFor="cancellation-reason">Reason for Cancellation</label>
                  <textarea
                    id="cancellation-reason"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Please provide a reason for cancelling this meeting..."
                    rows="4"
                    required
                  ></textarea>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button type="button" className="back-button" onClick={() => setShowCancelForm(false)}>
                    Back
                  </button>
                  <button type="submit" className="cancel-meeting-button" disabled={isSubmitting}>
                    {isSubmitting ? "Cancelling..." : "Cancel Meeting"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="meeting-actions">
              <button className="close-details-button" onClick={onClose}>
                Close
              </button>
              {(meeting.status === "scheduled" || meeting.status === "pending") && (
                <button className="show-cancel-form-button" onClick={() => setShowCancelForm(true)}>
                  <span className="cancel-icon">✕</span> Cancel Meeting
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MeetingDetailsDialog

