"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./StudentHome.css"
import MentorCard from "./MentorCard"
import LoadingSpinner from "./LoadingSpinner"
import ErrorMessage from "./ErrorMessage"
import ChatBot from "./ChatBot"
import VideoCall from "./VideoCall"
import UpcomingMeetingAlert from "./UpcomingMeetingAlert"

const HomePage = () => {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [upcomingMeeting, setUpcomingMeeting] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [showMeetingAlert, setShowMeetingAlert] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const studentId = localStorage.getItem("studentId")
    if (!studentId) {
      // Redirect to login page if not logged in
      navigate("/student")
      return
    }

    const fetchMentors = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:5000/api/studentHome/mentors", {
          credentials: "omit", // Don't send credentials
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch mentors: ${response.status}`)
        }
        const data = await response.json()

        // Sort mentors by experience (descending order)
        const sortedMentors = data.sort((a, b) => {
          // If experience is a number field
          if (a.yearsOfExperience && b.yearsOfExperience) {
            return b.yearsOfExperience - a.yearsOfExperience
          }
          // If experience is stored as a string like "5 years"
          const expA = a.experience ? Number.parseInt(a.experience) : 0
          const expB = b.experience ? Number.parseInt(b.experience) : 0
          return expB - expA
        })

        setMentors(sortedMentors)
        setError(null)
      } catch (err) {
        console.error("Error fetching mentors:", err)
        setError("Failed to load mentors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    const checkUpcomingMeetings = async () => {
      try {
        const studentId = localStorage.getItem("studentId")
        if (!studentId) return

        const response = await fetch(`http://localhost:5000/api/meetings/student/${studentId}/upcoming`, {
          credentials: "omit", // Don't send credentials
        })

        // Only process if response is OK
        if (response.ok) {
          const data = await response.json()

          if (data.meeting) {
            setUpcomingMeeting(data.meeting)

            // Check if meeting is within 30 minutes
            const meetingTime = new Date(`${data.meeting.date}T${data.meeting.time}`)
            const now = new Date()
            const timeDiff = meetingTime - now

            // If meeting is within 30 minutes, show alert
            if (timeDiff > 0 && timeDiff <= 30 * 60 * 1000) {
              setShowMeetingAlert(true)
            }
          } else {
            setUpcomingMeeting(null)
            setShowMeetingAlert(false)
          }
        } else {
          console.log("Failed to fetch upcoming meetings:", response.status)
        }
      } catch (err) {
        console.error("Error checking upcoming meetings:", err)
        // Don't set error state here to avoid disrupting the UI
      }
    }

    fetchMentors()
    checkUpcomingMeetings()

    // Set up interval to check for upcoming meetings every minute
    const intervalId = setInterval(checkUpcomingMeetings, 60000)
    return () => clearInterval(intervalId)
  }, [navigate])

  // Get unique categories from mentor data
  const categories = ["All", ...new Set(mentors.flatMap((mentor) => mentor.areasOfInterest || []))]

  // Filter mentors based on search term and selected category
  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentor.areasOfInterest &&
        mentor.areasOfInterest.some((area) => area.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesCategory =
      selectedCategory === "All" || (mentor.areasOfInterest && mentor.areasOfInterest.includes(selectedCategory))

    return matchesSearch && matchesCategory
  })

  const handleJoinCall = (meeting) => {
    setActiveCall(meeting)
  }

  const handleEndCall = () => {
    setActiveCall(null)
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("studentId")
    localStorage.removeItem("studentEmail")
    localStorage.removeItem("studentProfile")

    // Redirect to login page
    navigate("/student")
  }

  if (activeCall) {
    return <VideoCall meeting={activeCall} onEndCall={handleEndCall} isMentor={false} />
  }

  return (
    <div className="homepage">
      {showMeetingAlert && upcomingMeeting && (
        <UpcomingMeetingAlert
          meeting={upcomingMeeting}
          onJoin={handleJoinCall}
          onClose={() => setShowMeetingAlert(false)}
        />
      )}

      <header className="hero">
        <div className="hero-content">
          <h1>Find Your Perfect Mentor</h1>
          <p>Connect with industry experts who can guide you on your learning journey</p>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {upcomingMeeting && (
        <section className="upcoming-meeting-banner">
          <div className="container">
            <div className="upcoming-meeting-content">
              <div className="meeting-info">
                <h3>Upcoming Meeting</h3>
                <p>
                  You have a meeting with{" "}
                  <span className="mentor-name">{upcomingMeeting.mentorName || "your mentor"}</span> on{" "}
                  <span className="meeting-date">{new Date(upcomingMeeting.date).toLocaleDateString()}</span> at{" "}
                  <span className="meeting-time">{upcomingMeeting.time}</span>
                </p>
              </div>
              <div className="meeting-countdown" id="meeting-countdown">
                <UpcomingMeetingTimer meeting={upcomingMeeting} onJoin={handleJoinCall} />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="category-filter">
        <div className="container">
          <h2>Browse by Expertise</h2>
          <div className="category-buttons">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-button ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mentors-section">
        <div className="container">
          <h2>Our Expert Mentors</h2>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : filteredMentors.length === 0 ? (
            <div className="no-results">
              <h3>No mentors found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="mentors-grid">
              {filteredMentors.map((mentor) => (
                <MentorCard key={mentor._id || mentor.id} mentor={mentor} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to accelerate your learning?</h2>
            <p>Join our community today and connect with mentors who can help you achieve your goals.</p>
            <button className="cta-button">Get Started</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Mentor Connect. All rights reserved.</p>
        </div>
      </footer>

      <ChatBot />
    </div>
  )
}

const UpcomingMeetingTimer = ({ meeting, onJoin }) => {
  const [timeLeft, setTimeLeft] = useState("")
  const [canJoin, setCanJoin] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const meetingTime = new Date(`${meeting.date}T${meeting.time}`)
      const now = new Date()
      const difference = meetingTime - now

      // If meeting is in the past
      if (difference <= 0) {
        setTimeLeft("Meeting time has passed")
        setCanJoin(true)
        return
      }

      // Calculate days, hours, minutes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      // Format time left string
      let timeLeftStr = ""
      if (days > 0) {
        timeLeftStr += `${days} day${days !== 1 ? "s" : ""} `
      }
      if (hours > 0 || days > 0) {
        timeLeftStr += `${hours} hour${hours !== 1 ? "s" : ""} `
      }
      if (minutes > 0 || hours > 0 || days > 0) {
        timeLeftStr += `${minutes} minute${minutes !== 1 ? "s" : ""} `
      }
      timeLeftStr += `${seconds} second${seconds !== 1 ? "s" : ""}`

      setTimeLeft(timeLeftStr)

      // Enable join button if meeting is within 15 minutes
      if (difference <= 15 * 60 * 1000) {
        setCanJoin(true)
      } else {
        setCanJoin(false)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000) // Update every second

    return () => clearInterval(timer)
  }, [meeting])

  return (
    <div className="meeting-timer">
      <div className="time-left">{timeLeft}</div>
      {canJoin && (
        <button className="join-meeting-btn" onClick={() => onJoin(meeting)}>
          Join Meeting
        </button>
      )}
    </div>
  )
}

export default HomePage

