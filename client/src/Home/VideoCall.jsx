"use client"

import { useState, useEffect, useRef } from "react"
import AgoraRTC from "agora-rtc-sdk-ng"
// Remove the RTM import as we'll use a simpler approach for chat
import "./VideoCall.css"

const VideoCall = ({ meeting, onEndCall, isMentor }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState(null)
  const [localAudioTrack, setLocalAudioTrack] = useState(null)
  const [remoteUsers, setRemoteUsers] = useState([])
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenTrack, setScreenTrack] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [participantInfo, setParticipantInfo] = useState(null)
  const [callTime, setCallTime] = useState(0)
  const [isCallConnected, setIsCallConnected] = useState(false)
  const [isJoining, setIsJoining] = useState(true)
  const [error, setError] = useState(null)

  const client = useRef(null)
  const localVideoRef = useRef(null)
  const messagesEndRef = useRef(null)
  const rtmClient = useRef(null)
  const rtmChannel = useRef(null)

  // Generate a unique channel name based on the meeting ID
  const channelName = `meeting_${meeting._id}`

  // Agora app ID - in a real app, this should be stored in environment variables
  // Using a placeholder that will show a clear error message if not replaced
  const appId = "YOUR_AGORA_APP_ID" // Replace with your Agora App ID

  // Add a useEffect to check if the appId is valid
  useEffect(() => {
    if (appId === "YOUR_AGORA_APP_ID") {
      setError("Agora App ID not configured. Please set up a valid Agora App ID to enable video calls.")
    }
  }, [])

  useEffect(() => {
    // Initialize Agora client
    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })

    // We'll use a simpler approach for chat without RTM

    // Set up event listeners
    setupEventListeners()

    // Join the call
    joinCall()

    // Fetch participant info
    fetchParticipantInfo()

    // Start call timer
    const timerInterval = setInterval(() => {
      setCallTime((prevTime) => prevTime + 1)
    }, 1000)

    // Clean up on component unmount
    return () => {
      leaveCall()
      clearInterval(timerInterval)
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    scrollToBottom()
  }, [messages])

  const fetchParticipantInfo = async () => {
    try {
      const participantId = isMentor ? meeting.studentId : meeting.mentorId
      const endpoint = isMentor
        ? `http://localhost:5000/api/studentHome/student/${participantId}`
        : `http://localhost:5000/api/mentor/${participantId}`

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setParticipantInfo(data)
      }
    } catch (error) {
      console.error("Error fetching participant info:", error)
    }
  }

  const setupEventListeners = () => {
    // Handle user published events (when remote user publishes audio/video)
    client.current.on("user-published", async (user, mediaType) => {
      await client.current.subscribe(user, mediaType)

      if (mediaType === "video") {
        setRemoteUsers((prevUsers) => {
          if (prevUsers.find((u) => u.uid === user.uid)) {
            return prevUsers.map((u) => (u.uid === user.uid ? user : u))
          } else {
            return [...prevUsers, user]
          }
        })
      }

      if (mediaType === "audio") {
        user.audioTrack.play()
      }
    })

    // Handle user unpublished events (when remote user stops audio/video)
    client.current.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video") {
        setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
      }
    })

    // Handle user left events
    client.current.on("user-left", (user) => {
      setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
      addSystemMessage(`${user.uid} left the call`)
    })
  }

  const joinCall = async () => {
    try {
      setIsJoining(true)

      // Generate a UID for the user
      const uid = isMentor ? `mentor_${meeting.mentorId}` : `student_${meeting.studentId}`

      // Join the RTC channel for video
      await client.current.join(appId, channelName, null, uid)

      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()

      setLocalAudioTrack(audioTrack)
      setLocalVideoTrack(videoTrack)

      await client.current.publish([audioTrack, videoTrack])

      // Play local video track
      videoTrack.play(localVideoRef.current)

      setIsCallConnected(true)
      setIsJoining(false)

      // Add system message
      addSystemMessage("You joined the call")
    } catch (error) {
      console.error("Error joining call:", error)
      setError("Failed to join the call. Please check your camera and microphone permissions.")
      setIsJoining(false)
    }
  }

  const leaveCall = async () => {
    try {
      // Unpublish and close local tracks
      if (localAudioTrack) {
        localAudioTrack.close()
      }

      if (localVideoTrack) {
        localVideoTrack.close()
      }

      if (screenTrack) {
        screenTrack.close()
      }

      // Leave the channel
      await client.current.leave()

      // Update meeting status if needed
      if (isMentor) {
        try {
          await fetch(`http://localhost:5000/api/meetings/complete/${meeting._id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mentorId: meeting.mentorId,
              duration: callTime,
            }),
          })
        } catch (err) {
          console.error("Error updating meeting status:", err)
        }
      }
    } catch (error) {
      console.error("Error leaving call:", error)
    }
  }

  const toggleAudio = async () => {
    if (localAudioTrack) {
      if (isAudioMuted) {
        await localAudioTrack.setEnabled(true)
      } else {
        await localAudioTrack.setEnabled(false)
      }
      setIsAudioMuted(!isAudioMuted)
    }
  }

  const toggleVideo = async () => {
    if (localVideoTrack) {
      if (isVideoOff) {
        await localVideoTrack.setEnabled(true)
      } else {
        await localVideoTrack.setEnabled(false)
      }
      setIsVideoOff(!isVideoOff)
    }
  }

  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenTrack) {
        await client.current.unpublish(screenTrack)
        screenTrack.close()
        setScreenTrack(null)
      }

      // Republish video track
      if (localVideoTrack) {
        await client.current.publish(localVideoTrack)
      }
    } else {
      try {
        // Create screen track
        const tempScreenTrack = await AgoraRTC.createScreenVideoTrack()

        // Unpublish video track
        if (localVideoTrack) {
          await client.current.unpublish(localVideoTrack)
        }

        // Publish screen track
        await client.current.publish(tempScreenTrack)

        setScreenTrack(tempScreenTrack)
      } catch (error) {
        console.error("Error sharing screen:", error)
        return
      }
    }

    setIsScreenSharing(!isScreenSharing)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      // Add message to local state only (no RTM)
      const userId = isMentor ? `mentor_${meeting.mentorId}` : `student_${meeting.studentId}`
      addMessage(userId, newMessage, true)

      // Clear input
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const addMessage = (senderId, text, isLocal = false) => {
    const newMsg = {
      id: Date.now(),
      senderId,
      text,
      timestamp: new Date(),
      isLocal,
    }

    setMessages((prevMessages) => [...prevMessages, newMsg])
  }

  const addSystemMessage = (text) => {
    const newMsg = {
      id: Date.now(),
      senderId: "system",
      text,
      timestamp: new Date(),
      isSystem: true,
    }

    setMessages((prevMessages) => [...prevMessages, newMsg])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getSenderName = (senderId) => {
    if (senderId === "system") return "System"

    if (senderId.startsWith("mentor_")) {
      return isMentor ? "You" : participantInfo ? `${participantInfo.firstName} ${participantInfo.lastName}` : "Mentor"
    } else {
      return isMentor
        ? participantInfo
          ? `${participantInfo.firstName} ${participantInfo.lastName}`
          : "Student"
        : "You"
    }
  }

  if (error) {
    return (
      <div className="video-call-error">
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={joinCall}>Try Again</button>
            <button onClick={onEndCall}>Return to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  if (isJoining) {
    return (
      <div className="video-call-loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Joining Call...</h2>
          <p>Setting up your audio and video</p>
        </div>
      </div>
    )
  }

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <div className="call-info">
          <h2>
            {isMentor
              ? `Call with ${participantInfo ? participantInfo.firstName : "Student"}`
              : `Call with ${participantInfo ? participantInfo.firstName : "Mentor"}`}
          </h2>
          <div className="call-timer">{formatTime(callTime)}</div>
        </div>
        <div className="call-actions">
          <button className={`action-button ${isAudioMuted ? "muted" : ""}`} onClick={toggleAudio}>
            {isAudioMuted ? "Unmute" : "Mute"}
          </button>
          <button className={`action-button ${isVideoOff ? "off" : ""}`} onClick={toggleVideo}>
            {isVideoOff ? "Start Video" : "Stop Video"}
          </button>
          <button className={`action-button ${isScreenSharing ? "active" : ""}`} onClick={toggleScreenSharing}>
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </button>
          <button
            className="end-call-button"
            onClick={() => {
              leaveCall()
              onEndCall()
            }}
          >
            End Call
          </button>
        </div>
      </div>

      <div className="video-call-content">
        <div className="video-container">
          <div className="video-grid">
            <div className="video-item local-video">
              <div ref={localVideoRef} className="video-element"></div>
              <div className="video-label">You {isAudioMuted && "(Muted)"}</div>
            </div>

            {remoteUsers.map((user) => (
              <div key={user.uid} className="video-item">
                <div
                  id={`remote-${user.uid}`}
                  className="video-element"
                  ref={(el) => {
                    if (el && user.videoTrack) {
                      user.videoTrack.play(`remote-${user.uid}`)
                    }
                  }}
                ></div>
                <div className="video-label">{user.uid.startsWith("mentor_") ? "Mentor" : "Student"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-header">
            <h3>Chat</h3>
          </div>
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.isLocal ? "local" : ""} ${message.isSystem ? "system" : ""}`}
              >
                {!message.isSystem && <div className="message-sender">{getSenderName(message.senderId)}</div>}
                <div className="message-content">{message.text}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCall

