"use client"

import { useState, useEffect, useRef } from "react"
import "./VideoCall.css"
import { X, Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, Phone, Camera } from "lucide-react"

const VideoCall = ({ meeting, onEndCall, isMentor }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      senderId: "system",
      text: "Welcome to the video call. This session is being established...",
      timestamp: new Date(),
      isSystem: true,
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [participantInfo, setParticipantInfo] = useState(null)
  const [callTime, setCallTime] = useState(0)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [networkQuality, setNetworkQuality] = useState(100)
  const [callStatus, setCallStatus] = useState("connecting") // connecting, connected, unstable, reconnecting

  const messagesEndRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const networkIntervalRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // Fetch participant info
  useEffect(() => {
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
          addSystemMessage(`${data.firstName} ${data.lastName} has joined the call.`)
        } else {
          // Create fallback participant info
          setParticipantInfo({
            firstName: isMentor ? "Student" : "Mentor",
            lastName: "",
          })
          addSystemMessage(`${isMentor ? "Student" : "Mentor"} has joined the call.`)
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

    fetchParticipantInfo()

    // Start call timer
    timerIntervalRef.current = setInterval(() => {
      setCallTime((prevTime) => prevTime + 1)
    }, 1000)

    // Simulate connection sequence
    setTimeout(() => {
      addSystemMessage("Establishing secure connection...")
    }, 1000)

    setTimeout(() => {
      addSystemMessage("Audio stream connected.")
      setCallStatus("connected")
    }, 2000)

    setTimeout(() => {
      addSystemMessage("Video stream connected.")
    }, 3000)

    setTimeout(() => {
      addSystemMessage("Call quality is excellent.")
    }, 5000)

    // Simulate network quality changes
    networkIntervalRef.current = setInterval(() => {
      // Random network quality fluctuations
      const qualityChange = Math.random() > 0.7 ? -Math.floor(Math.random() * 20) : Math.floor(Math.random() * 10)
      setNetworkQuality((prev) => {
        const newQuality = Math.max(40, Math.min(100, prev + qualityChange))

        // Add system message if quality drops significantly
        if (prev > 70 && newQuality < 60) {
          addSystemMessage("Network quality has decreased. Some video degradation may occur.")
          setCallStatus("unstable")
        } else if (prev < 60 && newQuality > 70) {
          addSystemMessage("Network quality has improved.")
          setCallStatus("connected")
        } else if (newQuality < 45 && prev >= 45) {
          addSystemMessage("Poor connection detected. Video may be paused temporarily.")
          setCallStatus("reconnecting")
        } else if (newQuality >= 45 && prev < 45) {
          addSystemMessage("Connection restored.")
          setCallStatus("connected")
        }

        return newQuality
      })
    }, 15000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (networkIntervalRef.current) {
        clearInterval(networkIntervalRef.current)
      }
    }
  }, [isMentor, meeting.mentorId, meeting.studentId])

  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted)
    addSystemMessage(`You have ${isAudioMuted ? "unmuted" : "muted"} your microphone.`)
  }

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff)
    addSystemMessage(`You have turned ${isVideoOff ? "on" : "off"} your camera.`)
  }

  const toggleScreenSharing = () => {
    setIsScreenSharing(!isScreenSharing)
    addSystemMessage(`You have ${isScreenSharing ? "stopped" : "started"} sharing your screen.`)
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    // Add message to local state
    const userId = isMentor ? `mentor_${meeting.mentorId}` : `student_${meeting.studentId}`
    addMessage(userId, newMessage, true)

    // Clear input
    setNewMessage("")

    // Simulate response after a short delay
    if (Math.random() > 0.3) {
      setTimeout(
        () => {
          const responderId = isMentor ? `student_${meeting.studentId}` : `mentor_${meeting.mentorId}`
          const responses = [
            "I understand, thanks for explaining.",
            "That makes sense!",
            "Could you elaborate more on that?",
            "I appreciate your insights.",
            "Let me think about that for a moment.",
            "That's exactly what I was looking for!",
            "Great point! I hadn't considered that perspective.",
            "I'll make a note of that for our next discussion.",
            "Do you have any resources you could share on this topic?",
            "That's really helpful, thank you!",
          ]
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]
          addMessage(responderId, randomResponse, false)
        },
        1500 + Math.random() * 2000,
      )
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

  const handleEndCall = () => {
    // Update meeting status if needed
    if (isMentor) {
      try {
        fetch(`http://localhost:5000/api/meetings/complete/${meeting._id}`, {
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

    onEndCall()
  }

  const getInitials = (name) => {
    if (!name) return "?"
    return name.charAt(0).toUpperCase()
  }

  const getCallStatusIndicator = () => {
    switch (callStatus) {
      case "connecting":
        return <div className="call-status connecting">Connecting...</div>
      case "unstable":
        return <div className="call-status unstable">Unstable Connection</div>
      case "reconnecting":
        return <div className="call-status reconnecting">Reconnecting...</div>
      default:
        return <div className="call-status connected">Connected</div>
    }
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
          {getCallStatusIndicator()}
        </div>
        <div className="network-quality">
          <div className="quality-indicator">
            <div className="quality-bar">
              <div
                className="quality-level"
                style={{
                  width: `${networkQuality}%`,
                  backgroundColor: networkQuality > 70 ? "#10b981" : networkQuality > 45 ? "#f59e0b" : "#ef4444",
                }}
              ></div>
            </div>
            <span className="quality-text">
              {networkQuality > 70 ? "Excellent" : networkQuality > 45 ? "Good" : "Poor"}
            </span>
          </div>
        </div>
        <div className="call-actions">
          <button
            className={`action-button ${isAudioMuted ? "muted" : ""}`}
            onClick={toggleAudio}
            title={isAudioMuted ? "Unmute" : "Mute"}
          >
            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            className={`action-button ${isVideoOff ? "off" : ""}`}
            onClick={toggleVideo}
            title={isVideoOff ? "Start Video" : "Stop Video"}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
          <button
            className={`action-button ${isScreenSharing ? "active" : ""}`}
            onClick={toggleScreenSharing}
            title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          >
            <Monitor size={20} />
          </button>
          <button
            className={`action-button ${isChatOpen ? "active" : ""}`}
            onClick={toggleChat}
            title={isChatOpen ? "Hide Chat" : "Show Chat"}
          >
            <MessageSquare size={20} />
          </button>
          <button className="end-call-button" onClick={handleEndCall} title="End Call">
            <Phone size={20} />
          </button>
        </div>
      </div>

      <div className="video-call-content">
        <div className={`video-container ${isChatOpen ? "with-chat" : "full-width"}`}>
          <div className="video-grid">
            <div className="video-item local-video">
              <div className="video-element">
                {isVideoOff ? (
                  <div className="video-placeholder">
                    <div className="avatar-circle">{isMentor ? getInitials("Mentor") : getInitials("Student")}</div>
                    <div className="status-text">Camera Off</div>
                  </div>
                ) : (
                  <div className="demo-video-stream you">
                    <div className="video-animation"></div>
                    <div className="video-overlay">
                      <div className="camera-indicator">
                        <Camera size={16} />
                      </div>
                      {isAudioMuted && (
                        <div className="muted-indicator">
                          <MicOff size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="video-label">You {isAudioMuted && <MicOff size={14} className="inline-icon" />}</div>
            </div>

            <div className="video-item remote-video">
              <div className="video-element">
                {isScreenSharing ? (
                  <div className="screen-share-demo">
                    <div className="screen-content">
                      <div className="screen-header">
                        <div className="screen-tab active">Document.pdf</div>
                        <div className="screen-tab">Presentation.pptx</div>
                        <div className="screen-controls">
                          <div className="screen-control"></div>
                          <div className="screen-control"></div>
                          <div className="screen-control"></div>
                        </div>
                      </div>
                      <div className="screen-body">
                        <div className="screen-sidebar">
                          <div className="sidebar-item active"></div>
                          <div className="sidebar-item"></div>
                          <div className="sidebar-item"></div>
                          <div className="sidebar-item"></div>
                        </div>
                        <div className="screen-main">
                          <div className="document-content">
                            <div className="document-title"></div>
                            <div className="document-paragraph"></div>
                            <div className="document-paragraph"></div>
                            <div className="document-image"></div>
                            <div className="document-paragraph"></div>
                            <div className="document-paragraph short"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="demo-video-stream other">
                    <div className="video-animation"></div>
                    <div className="participant-overlay">
                      <div className="participant-avatar">
                        {isMentor
                          ? getInitials(participantInfo?.firstName || "Student")
                          : getInitials(participantInfo?.firstName || "Mentor")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="video-label">
                {isMentor ? participantInfo?.firstName || "Student" : participantInfo?.firstName || "Mentor"}
              </div>
            </div>
          </div>
        </div>

        {isChatOpen && (
          <div className="chat-container">
            <div className="chat-header">
              <h3>Chat</h3>
              <button className="close-chat-btn" onClick={toggleChat}>
                <X size={18} />
              </button>
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
        )}
      </div>
    </div>
  )
}

export default VideoCall

