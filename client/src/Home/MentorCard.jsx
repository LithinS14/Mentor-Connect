"use client"

import { useState, useEffect } from "react"
import "./MentorCard.css"
import MeetingDialog from "./MeetingDialog"
import MeetingDetailsDialog from "./MeetingDetailsDialog"

const MentorCard = ({ mentor }) => {
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [bookedMeeting, setBookedMeeting] = useState(null)

  // Fallback image if profile picture is not available
  const fallbackImage = `https://api.dicebear.com/7.x/initials/svg?seed=${mentor.firstName}%20${mentor.lastName}`

  // Mock student info
  const getStudentInfo = () => {
    return {
      _id: "student123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phoneNumber: "123-456-7890",
      educationLevel: "Bachelor's Degree",
      currentSchool: "University of Technology",
      goals: "I want to learn web development and build my portfolio.",
      areasOfInterest: ["Web Development", "UI/UX Design"],
    }
  }

  // Check if there's a booked meeting with this mentor
  useEffect(() => {
    const checkBookedMeetings = async () => {
      try {
        const studentId = localStorage.getItem("studentId")
        if (studentId) {
          const response = await fetch(`http://localhost:5000/api/meetings/student/${studentId}/mentor/${mentor._id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.meeting) {
              setBookedMeeting(data.meeting)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching booked meetings:", error)
      }
    }

    checkBookedMeetings()
  }, [mentor._id])

  const handleConnectClick = () => {
    setShowMeetingDialog(true)
  }

  const handleViewDetailsClick = () => {
    setShowDetailsDialog(true)
  }

  const handleMeetingBooked = (meetingData) => {
    setBookedMeeting(meetingData)
    setShowMeetingDialog(false)
  }

  return (
    <>
      <div className="mentor-card">
        {/* Profile Picture */}
        <div className="mentor-image-container">
          <img
            src={mentor.profilePicture || fallbackImage}
            alt={`${mentor.firstName} ${mentor.lastName}`}
            className="mentor-image"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = fallbackImage
            }}
          />
        </div>

        {/* Interest Tags Below Profile Picture */}
        <div className="mentor-tags-container">
          {mentor.areasOfInterest &&
            mentor.areasOfInterest.map((area, index) => (
              <span key={index} className="expertise-tag">
                {area}
              </span>
            ))}
        </div>

        {/* Mentor Info on the Right-Hand Side */}
        <div className="mentor-info">
          <h3 className="mentor-name">
            {mentor.firstName} {mentor.lastName}
          </h3>
          <p className="mentor-experience">{mentor.yearsOfExperience} years of experience</p>
          <p className="mentor-bio">{mentor.bio || "Experienced mentor ready to help students achieve their goals."}</p>

          {bookedMeeting ? (
            <div className="meeting-status">
              <p className="meeting-scheduled">Meeting Scheduled</p>
              <button className="view-details-button" onClick={handleViewDetailsClick}>
                View Details
              </button>
            </div>
          ) : (
            <button className="connect-button" onClick={handleConnectClick}>
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Meeting Dialog - Rendered Outside the Card */}
      {showMeetingDialog && (
        <div className="dialog-overlay">
          <MeetingDialog
            mentor={mentor}
            onClose={() => setShowMeetingDialog(false)}
            studentInfo={getStudentInfo()}
            onMeetingBooked={handleMeetingBooked}
          />
        </div>
      )}

      {/* Meeting Details Dialog */}
      {showDetailsDialog && bookedMeeting && (
        <div className="dialog-overlay">
          <MeetingDetailsDialog
            meeting={bookedMeeting}
            mentor={mentor}
            onClose={() => setShowDetailsDialog(false)}
            onMeetingCancelled={() => setBookedMeeting(null)}
          />
        </div>
      )}
    </>
  )
}

export default MentorCard

