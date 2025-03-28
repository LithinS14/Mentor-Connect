"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./MentorHome.css"
import MentorMeetingCard from "./MentorMeetingCard"
import VideoCall from "./VideoCall"
import LoadingSpinner from "./LoadingSpinner"
import ErrorMessage from "./ErrorMessage"

const MentorHome = () => {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [mentorInfo, setMentorInfo] = useState(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [pendingMeetings, setPendingMeetings] = useState([])
  const [completedMeetings, setCompletedMeetings] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const mentorId = localStorage.getItem("mentorId")
    if (!mentorId) {
      // Redirect to login page if not logged in
      navigate("/mentor")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch mentor info
        console.log("Fetching mentor with ID:", mentorId)
        const mentorResponse = await fetch(`http://localhost:5000/api/mentor/${mentorId}`, {
          credentials: "omit", // Don't send credentials
        })

        if (!mentorResponse.ok) {
          console.error("Failed to fetch mentor:", mentorResponse.status, mentorResponse.statusText)
          throw new Error("Failed to fetch mentor information")
        }

        const mentorData = await mentorResponse.json()
        setMentorInfo(mentorData)
        localStorage.setItem("mentorProfile", JSON.stringify(mentorData))

        // Fetch meetings
        const meetingsResponse = await fetch(`http://localhost:5000/api/meetings/mentor/${mentorId}`, {
          credentials: "omit", // Don't send credentials
        })

        if (!meetingsResponse.ok) {
          console.error("Failed to fetch meetings:", meetingsResponse.status, meetingsResponse.statusText)
          throw new Error("Failed to fetch meetings")
        }

        const meetingsData = await meetingsResponse.json()
        setMeetings(meetingsData.meetings || [])

        // Categorize meetings
        const now = new Date()
        const upcoming = []
        const pending = []
        const completed = []

        if (meetingsData.meetings && meetingsData.meetings.length > 0) {
          meetingsData.meetings.forEach((meeting) => {
            const meetingDate = new Date(meeting.date)

            if (meeting.status === "pending") {
              pending.push(meeting)
            } else if (
              meeting.status === "completed" ||
              meeting.status === "cancelled" ||
              meeting.status === "rejected"
            ) {
              completed.push(meeting)
            } else if (meetingDate > now) {
              upcoming.push(meeting)
            } else {
              completed.push(meeting)
            }
          })
        }

        setUpcomingMeetings(upcoming)
        setPendingMeetings(pending)
        setCompletedMeetings(completed)
        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up interval to refresh data every minute
    const intervalId = setInterval(fetchData, 60000)
    return () => clearInterval(intervalId)
  }, [navigate])

  const handleAcceptMeeting = async (meetingId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/meetings/accept/${meetingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mentorId: localStorage.getItem("mentorId"),
        }),
        credentials: "omit", // Don't send credentials
      })

      if (!response.ok) {
        throw new Error("Failed to accept meeting")
      }

      // Update meetings list
      const updatedMeetings = meetings.map((meeting) =>
        meeting._id === meetingId ? { ...meeting, status: "scheduled" } : meeting,
      )
      setMeetings(updatedMeetings)

      // Move from pending to upcoming
      const acceptedMeeting = pendingMeetings.find((m) => m._id === meetingId)
      if (acceptedMeeting) {
        setPendingMeetings(pendingMeetings.filter((m) => m._id !== meetingId))
        setUpcomingMeetings([...upcomingMeetings, { ...acceptedMeeting, status: "scheduled" }])
      }
    } catch (err) {
      console.error("Error accepting meeting:", err)
      setError(err.message)
    }
  }

  const handleRejectMeeting = async (meetingId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/meetings/reject/${meetingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mentorId: localStorage.getItem("mentorId"),
          rejectionReason: "Unable to accommodate at this time", // You could add a form for this
        }),
        credentials: "omit", // Don't send credentials
      })

      if (!response.ok) {
        throw new Error("Failed to reject meeting")
      }

      // Update meetings list
      const updatedMeetings = meetings.map((meeting) =>
        meeting._id === meetingId ? { ...meeting, status: "rejected" } : meeting,
      )
      setMeetings(updatedMeetings)

      // Move from pending to completed (rejected)
      const rejectedMeeting = pendingMeetings.find((m) => m._id === meetingId)
      if (rejectedMeeting) {
        setPendingMeetings(pendingMeetings.filter((m) => m._id !== meetingId))
        setCompletedMeetings([...completedMeetings, { ...rejectedMeeting, status: "rejected" }])
      }
    } catch (err) {
      console.error("Error rejecting meeting:", err)
      setError(err.message)
    }
  }

  const handleStartCall = (meeting) => {
    setActiveCall(meeting)
  }

  const handleEndCall = () => {
    setActiveCall(null)
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("mentorId")
    localStorage.removeItem("mentorProfile")

    // Redirect to login page
    navigate("/mentor")
  }

  if (activeCall) {
    return <VideoCall meeting={activeCall} onEndCall={handleEndCall} isMentor={true} />
  }

  return (
    <div className="mentor-home">
      <header className="mentor-header">
        <div className="mentor-header-content">
          <h1>Welcome, {mentorInfo ? `${mentorInfo.firstName} ${mentorInfo.lastName}` : "Mentor"}</h1>
          <p>Manage your mentoring sessions and connect with students</p>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="mentor-dashboard">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            <section className="meetings-section">
              <h2>Pending Meeting Requests</h2>
              {pendingMeetings.length === 0 ? (
                <div className="no-meetings">
                  <p>No pending meeting requests</p>
                </div>
              ) : (
                <div className="meetings-grid">
                  {pendingMeetings.map((meeting) => (
                    <MentorMeetingCard
                      key={meeting._id}
                      meeting={meeting}
                      onAccept={() => handleAcceptMeeting(meeting._id)}
                      onReject={() => handleRejectMeeting(meeting._id)}
                      isPending={true}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="meetings-section">
              <h2>Upcoming Meetings</h2>
              {upcomingMeetings.length === 0 ? (
                <div className="no-meetings">
                  <p>No upcoming meetings</p>
                </div>
              ) : (
                <div className="meetings-grid">
                  {upcomingMeetings.map((meeting) => (
                    <MentorMeetingCard
                      key={meeting._id}
                      meeting={meeting}
                      onStartCall={() => handleStartCall(meeting)}
                      isUpcoming={true}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="meetings-section">
              <h2>Past Meetings</h2>
              {completedMeetings.length === 0 ? (
                <div className="no-meetings">
                  <p>No past meetings</p>
                </div>
              ) : (
                <div className="meetings-grid">
                  {completedMeetings.map((meeting) => (
                    <MentorMeetingCard key={meeting._id} meeting={meeting} isPast={true} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default MentorHome

