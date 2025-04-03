"use client"

import { useState, useEffect, useRef } from "react"
import AgoraRTC from "agora-rtc-sdk-ng"
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
  const [permissionsChecked, setPermissionsChecked] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)

  const client = useRef(null)
  const localVideoRef = useRef(null)
  const messagesEndRef = useRef(null)
  const timerIntervalRef = useRef(null)

  // Generate a unique channel name based on the meeting ID
  const channelName = `meeting_${meeting._id}`

  // Agora app ID - in a real app, this should be stored in environment variables
  // Using a placeholder that will show a clear error message if not replaced
  const appId = process.env.REACT_APP_AGORA_APP_ID || "YOUR_AGORA_APP_ID"

  // Check for media permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check if we can access camera and microphone
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setHasPermissions(true)
      } catch (err) {
        console.error("Media permissions error:", err)
        setHasPermissions(false)
        setError(`Media permissions denied: ${err.message}. Please allow camera and microphone access.`)
      } finally {
        setPermissionsChecked(true)
      }
    }

    checkPermissions()
  }, [])

  // Check if Agora App ID is valid
  useEffect(() => {
    if (appId === "YOUR_AGORA_APP_ID") {
      setError("Video calls are currently disabled. Please contact the administrator to enable this feature.")
    }
  }, [appId])

  // Initialize Agora client and join call
  useEffect(() => {
    if (!permissionsChecked || !hasPermissions || appId === "YOUR_AGORA_APP_ID") {
      return // Don't proceed if permissions aren't granted or App ID is invalid
    }

    // Initialize Agora client
    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })

    // Set up event listeners
    setupEventListeners()

    // Join the call
    joinCall()

    // Fetch participant info
    fetchParticipantInfo()

    // Start call timer
    timerIntervalRef.current = setInterval(() => {
      setCallTime((prevTime) => prevTime + 1)
    }, 1000)

    // Clean up on component unmount
    return () => {
      leaveCall()
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [permissionsChecked, hasPermissions])

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
      } else {
        // Create fallback participant info
        setParticipantInfo({
          firstName: isMentor ? "Student" : "Mentor",
          lastName: "",
        })
      }
    } catch (error) {
      console.error("Error fetching participant info:", error)
      // Create fallback participant info
      setParticipantInfo({
        firstName: isMentor ? "Student" : "Mentor",
        lastName: "",
      })
    }
  }

  const setupEventListeners = () => {
    if (!client.current) return

    // Handle user published events (when remote user publishes audio/video)
    client.current.on("user-published", async (user, mediaType) => {
      try {
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
      } catch (err) {
        console.error("Error subscribing to remote user:", err)
        addSystemMessage(`Failed to connect to remote user: ${err.message}`)
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

    // Handle connection state changes
    client.current.on("connection-state-change", (curState, prevState) => {
      console.log(`Connection state changed from ${prevState} to ${curState}`)
      if (curState === "DISCONNECTED") {
        addSystemMessage("You were disconnected. Attempting to reconnect...")
      } else if (curState === "CONNECTED") {
        addSystemMessage("Connection established")
      }
    })
  }

  const joinCall = async () => {
    try {
      setIsJoining(true)

      // Check if appId is valid before proceeding
      if (appId === "YOUR_AGORA_APP_ID") {
        throw new Error("Agora App ID not configured. Please set up a valid Agora App ID to enable video calls.")
      }

      // Generate a UID for the user
      const uid = isMentor ? `mentor_${meeting.mentorId}` : `student_${meeting.studentId}`

      // Join the RTC channel for video
      await client.current.join(appId, channelName, null, uid)

      // Create and publish local tracks with error handling
      try {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            encoderConfig: "standard",
            AEC: true,
            AGC: true,
            ANS: true,
          },
          {
            encoderConfig: "standard",
            facingMode: "user",
          },
        )

        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)

        await client.current.publish([audioTrack, videoTrack])

        // Play local video track
        videoTrack.play(localVideoRef.current)

        setIsCallConnected(true)
        setIsJoining(false)

        // Add system message
        addSystemMessage("You joined the call")
      } catch (trackError) {
        console.error("Error creating local tracks:", trackError)

        // Try to join with just audio if video fails
        if (trackError.message.includes("video")) {
          try {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
            setLocalAudioTrack(audioTrack)
            await client.current.publish([audioTrack])

            setIsCallConnected(true)
            setIsJoining(false)
            setIsVideoOff(true)

            addSystemMessage("Joined with audio only. Video is unavailable.")
          } catch (audioError) {
            throw new Error(`Could not access microphone: ${audioError.message}`)
          }
        } else {
          throw trackError
        }
      }
    } catch (error) {
      console.error("Error joining call:", error)
      setError(error.message || "Failed to join the call. Please check your camera and microphone permissions.")
      setIsJoining(false)
    }
  }

  const leaveCall = async () => {
    try {
      // Unpublish and close local tracks
      if (localAudioTrack) {
        await client.current?.unpublish(localAudioTrack)
        localAudioTrack.close()
      }

      if (localVideoTrack) {
        await client.current?.unpublish(localVideoTrack)
        localVideoTrack.close()
      }

      if (screenTrack) {
        await client.current?.unpublish(screenTrack)
        screenTrack.close()
      }

      // Leave the channel
      await client.current?.leave()

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
      try {
        await localAudioTrack.setEnabled(!isAudioMuted)
        setIsAudioMuted(!isAudioMuted)
      } catch (err) {
        console.error("Error toggling audio:", err)
        addSystemMessage(`Failed to ${isAudioMuted ? "unmute" : "mute"}: ${err.message}`)
      }
    }
  }

  const toggleVideo = async () => {
    if (localVideoTrack) {
      try {
        await localVideoTrack.setEnabled(!isVideoOff)
        setIsVideoOff(!isVideoOff)
      } catch (err) {
        console.error("Error toggling video:", err)
        addSystemMessage(`Failed to ${isVideoOff ? "start" : "stop"} video: ${err.message}`)
      }
    }
  }

  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      try {
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

        setIsScreenSharing(false)
      } catch (err) {
        console.error("Error stopping screen sharing:", err)
        addSystemMessage(`Failed to stop screen sharing: ${err.message}`)
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

        // Handle screen share stopped by user through browser UI
        tempScreenTrack.on("track-ended", () => {
          toggleScreenSharing()
        })

        setScreenTrack(tempScreenTrack)
        setIsScreenSharing(true)
      } catch (error) {
        console.error("Error sharing screen:", error)
        addSystemMessage(`Failed to share screen: ${error.message}`)
        return
      }
    }
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

  const retryJoinCall = () => {
    setError(null)
    setIsJoining(true)
    joinCall()
  }

  // Render error state
  if (error) {
    return (
      <div className="video-call-error">
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={retryJoinCall}>Try Again</button>
            <button onClick={onEndCall}>Return to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  // Render loading state
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

  // Render fallback UI if Agora isn't available
  if (appId === "YOUR_AGORA_APP_ID") {
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
          <button
            className="end-call-button"
            onClick={() => {
              onEndCall()
            }}
          >
            End Call
          </button>
        </div>

        <div className="video-call-content" style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center", maxWidth: "600px", padding: "20px" }}>
            <h2>Video Call Not Available</h2>
            <p>The video call feature requires an Agora App ID to be configured.</p>
            <p>Please contact the administrator to set up video calling.</p>
            <p>You can still use the chat feature below to communicate.</p>
          </div>
        </div>

        <div className="chat-container" style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
          <div className="chat-header">
            <h3>Chat</h3>
          </div>
          <div className="chat-messages">
            <div className="chat-message system">
              <div className="message-content">Welcome to the chat. Video calling is not available at this time.</div>
            </div>
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
    )
  }

  // Main UI
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

