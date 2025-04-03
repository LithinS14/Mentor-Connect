"use client"

import { useState, useEffect } from "react"
import "./MentorMeetingCard.css"
import MeetingDetailsDialog from "./MeetingDetailsDialog"

const MentorMeetingCard = ({ meeting, onAccept, onReject, onStartCall, isPending, isUpcoming, isPast }) => {
  const [student, setStudent] = useState(null)
  const [timeLeft, setTimeLeft] = useState("")
  const [canStartCall, setCanStartCall] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [mentor, setMentor] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchStudent = async () => {
      try {
        // Check if we already tried to fetch this student
        const cachedStudent = localStorage.getItem(`student_${meeting.studentId}`)
        if (cachedStudent) {
          setStudent(JSON.parse(cachedStudent))
          return
        }

        const response = await fetch(`http://localhost:5000/api/studentHome/student/${meeting.studentId}`, {
          credentials: "omit", // Don't send credentials
        })

        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          setStudent(data)
          // Cache the student data to prevent repeated requests
          localStorage.setItem(`student_${meeting.studentId}`, JSON.stringify(data))
        } else {
          console.warn(`Could not fetch student with ID: ${meeting.studentId}. Using fallback data.`)
          const fallbackStudent = {
            _id: meeting.studentId,
            firstName: meeting.studentName || "Student",
            lastName: "",
            educationLevel: "Not available",
            currentSchool: "Not available",
            areasOfInterest: ["Not available"],
          }
          setStudent(fallbackStudent)
          // Cache the fallback data to prevent repeated requests
          localStorage.setItem(`student_${meeting.studentId}`, JSON.stringify(fallbackStudent))
        }
      } catch (error) {
        if (!isMounted) return

        console.error("Error fetching student:", error)
        // Set fallback student data
        const fallbackStudent = {
          _id: meeting.studentId,
          firstName: meeting.studentName || "Student",
          lastName: "",
          educationLevel: "Not available",
          currentSchool: "Not available",
          areasOfInterest: ["Not available"],
        }
        setStudent(fallbackStudent)
        // Cache the fallback data to prevent repeated requests
        localStorage.setItem(`student_${meeting.studentId}`, JSON.stringify(fallbackStudent))
      }
    }

    fetchStudent()

    return () => {
      isMounted = false
    }
  }, [meeting.studentId, meeting.studentName])

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/mentor/${meeting.mentorId}`, {
          credentials: "omit", // Don't send credentials
        })
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
    if (!isUpcoming) return

    const calculateTimeLeft = () => {
      const meetingTime = new Date(`${meeting.date}T${meeting.time}`)
      const now = new Date()
      const difference = meetingTime - now

      // If meeting is in the past
      if (difference <= 0) {
        setTimeLeft("Meeting time has passed")
        return
      }

      // Calculate days, hours, minutes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

      // Format time left string
      let timeLeftStr = ""
      if (days > 0) {
        timeLeftStr += `${days} day${days !== 1 ? "s" : ""} `
      }
      if (hours > 0 || days > 0) {
        timeLeftStr += `${hours} hour${hours !== 1 ? "s" : ""} `
      }
      timeLeftStr += `${minutes} minute${minutes !== 1 ? "s" : ""}`

      setTimeLeft(timeLeftStr)

      // Enable start call button if meeting is within 15 minutes
      if (difference <= 15 * 60 * 1000) {
        setCanStartCall(true)
      } else {
        setCanStartCall(false)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [meeting, isUpcoming])

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleViewDetails = () => {
    setShowDetailsDialog(true)
  }

  const handleCloseDetails = () => {
    setShowDetailsDialog(false)
  }

  const handleMeetingCancelled = () => {
    // You can implement any additional logic here if needed
    // For example, refreshing the meetings list
  }

  if (!student) {
    return <div className="mentor-meeting-card loading">Loading student information...</div>
  }

  return (
    <>
      <div className={`mentor-meeting-card ${isPending ? "pending" : ""} ${isPast ? "past" : ""}`}>
        <div className="meeting-header">
          <div className="student-info">
            <div className="student-avatar">
              {student.firstName.charAt(0)}
              {student.lastName ? student.lastName.charAt(0) : ""}
            </div>
            <h3 className="student-name">
              {student.firstName} {student.lastName}
            </h3>
          </div>
          {isPending && <span className="status-badge pending">Pending</span>}
          {isUpcoming && <span className="status-badge upcoming">Upcoming</span>}
          {isPast && (
            <span
              className={`status-badge ${meeting.status === "cancelled" || meeting.status === "rejected" ? "cancelled" : "completed"}`}
            >
              {meeting.status === "cancelled" ? "Cancelled" : meeting.status === "rejected" ? "Rejected" : "Completed"}
            </span>
          )}
        </div>

        <div className="meeting-details">
          <div className="detail-item">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{formatDate(meeting.date)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Time:</span>
            <span className="detail-value">{meeting.time}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">{meeting.duration} minutes</span>
          </div>
          {isUpcoming && (
            <div className="detail-item time-left">
              <span className="detail-label">Time Left:</span>
              <span className="detail-value highlight">{timeLeft}</span>
            </div>
          )}
        </div>

        <div className="meeting-topic">
          <h4>Discussion Topic:</h4>
          <p>{meeting.topic}</p>
        </div>

        <div className="student-background">
          <h4>Student Background:</h4>
          <div className="background-details">
            <div className="background-item">
              <span className="background-label">Education:</span>
              <span className="background-value">{student.educationLevel}</span>
            </div>
            <div className="background-item">
              <span className="background-label">School:</span>
              <span className="background-value">{student.currentSchool}</span>
            </div>
            <div className="background-item">
              <span className="background-label">Interests:</span>
              <span className="background-value">{student.areasOfInterest.join(", ")}</span>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="meeting-actions">
            <button className="reject-btn" onClick={onReject}>
              Decline
            </button>
            <button className="accept-btn" onClick={onAccept}>
              Accept
            </button>
          </div>
        )}

        {isUpcoming && (
          <div className="meeting-actions">
            <button className="view-details-btn" onClick={handleViewDetails}>
              View Details
            </button>
            <button className="start-call-btn" onClick={onStartCall} disabled={!canStartCall}>
              {canStartCall ? "Start Call" : "Call Available 15 min Before"}
            </button>
          </div>
        )}

        {isPast && (
          <div className="meeting-actions">
            <button className="view-details-btn" onClick={handleViewDetails}>
              View Details
            </button>
          </div>
        )}
      </div>

      {showDetailsDialog && (
        <div className="dialog-overlay">
          <MeetingDetailsDialog
            meeting={meeting}
            mentor={mentor || { _id: meeting.mentorId, firstName: "Mentor", lastName: "" }}
            onClose={handleCloseDetails}
            onMeetingCancelled={handleMeetingCancelled}
          />
        </div>
      )}
    </>
  )
}

export default MentorMeetingCard

