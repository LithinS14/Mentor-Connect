"use client"

import { useState, useEffect } from "react"

const UpcomingMeetingTimer = ({ meeting }) => {
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

      // Enable join button for all upcoming meetings (for demo purposes)
      setCanJoin(true)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000) // Update every second

    return () => clearInterval(timer)
  }, [meeting])

  return (
    <div>
      {timeLeft && <p>Time until meeting: {timeLeft}</p>}
      {canJoin && <button>Join Meeting</button>}
    </div>
  )
}

export default UpcomingMeetingTimer

