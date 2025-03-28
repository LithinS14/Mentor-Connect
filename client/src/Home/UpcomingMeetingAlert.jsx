"use client"

import { useState, useEffect } from "react"
import "./UpcomingMeetingAlert.css"

const UpcomingMeetingAlert = ({ meeting, onJoin, onClose }) => {
  const [mentor, setMentor] = useState(null)
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/mentor/${meeting.mentorId}`)
        if (response.ok) {
          const data = await response.json()
          setMentor(data)
        }
      } catch (error) {
        console.error("Error fetching mentor:", error)
      }
    }

    fetchMentor()
  }, [meeting.mentorId])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const meetingTime = new Date(`${meeting.date}T${meeting.time}`)
      const now = new Date()
      const difference = meetingTime - now

      // If meeting is in the past
      if (difference <= 0) {
        setTimeLeft("Meeting is starting now!")
        return
      }

      // Calculate minutes
      const minutes = Math.floor(difference / (1000 * 60))

      if (minutes <= 1) {
        setTimeLeft("Meeting is starting in less than a minute!")
      } else {
        setTimeLeft(`Meeting starts in ${minutes} minutes`)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [meeting])

  return (
    <div className="upcoming-meeting-alert">
      <div className="alert-content">
        <div className="alert-icon">🔔</div>
        <div className="alert-message">
          <h3>Upcoming Meeting</h3>
          <p>
            {timeLeft} with {mentor ? `${mentor.firstName} ${mentor.lastName}` : "your mentor"}
          </p>
        </div>
        <div className="alert-actions">
          <button className="join-now-btn" onClick={() => onJoin(meeting)}>
            Join Now
          </button>
          <button className="dismiss-btn" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpcomingMeetingAlert

