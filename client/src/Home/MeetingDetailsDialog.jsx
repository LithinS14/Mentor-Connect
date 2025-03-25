"use client"

import { useState } from "react"
import "./MeetingDetailsDialog.css"

const MeetingDetailsDialog = ({ meeting, mentor, onClose, onMeetingCancelled }) => {
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
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
      const response = await fetch(`http://localhost:5000/api/meetings/cancel/${meeting._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancellationReason,
          studentId: meeting.studentId,
          mentorId: mentor._id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel meeting")
      }

      setSuccess(true)

      // Notify parent component that meeting was cancelled
      setTimeout(() => {
        onMeetingCancelled()
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
            Your meeting with {mentor.firstName} {mentor.lastName} has been cancelled.
          </p>
          <p>Both you and the mentor have been notified via email.</p>
        </div>
      ) : (
        <div className="meeting-details-content">
          <div className="meeting-info-section">
            <h3>Meeting Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Mentor:</span>
                <span className="info-value">
                  {mentor.firstName} {mentor.lastName}
                </span>
              </div>
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
            </div>
          </div>

          <div className="meeting-topic-section">
            <h3>Discussion Topic</h3>
            <p className="meeting-topic">{meeting.topic}</p>
          </div>

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
              <button className="show-cancel-form-button" onClick={() => setShowCancelForm(true)}>
                Cancel Meeting
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MeetingDetailsDialog
