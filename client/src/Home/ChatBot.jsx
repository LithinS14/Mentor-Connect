"use client"

import { useState, useRef, useEffect } from "react"
import "./ChatBot.css"
import { MessageSquare, X, Phone, Mail, Info, Calendar, XCircle, User } from "lucide-react"

const MentoBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm Mento Bot. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const quickOptions = [
    { id: "book", text: "How to book meeting", icon: <Calendar size={16} /> },
    { id: "cancel", text: "How to cancel meeting", icon: <XCircle size={16} /> },
    { id: "about", text: "About us", icon: <Info size={16} /> },
    { id: "support", text: "Contact support", icon: <Phone size={16} /> },
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleQuickOption = (optionId) => {
    // Add user message based on the option clicked
    const optionText = quickOptions.find((option) => option.id === optionId).text

    const userMessage = {
      id: Date.now(),
      text: optionText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate bot typing
    setIsTyping(true)

    // Process the option and get a response
    setTimeout(() => {
      const botResponse = getBotResponse(optionId)
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: botResponse,
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    }, 1000)
  }

  const getBotResponse = (input) => {
    // Convert input to lowercase for easier matching
    const lowerInput = typeof input === "string" ? input.toLowerCase() : input

    // Check for predefined responses
    if (lowerInput === "book" || lowerInput.includes("book meeting") || lowerInput.includes("schedule")) {
      return "To book a meeting: Click on the 'Connect' button in the mentor card, select your preferred time and date, and click 'Book Meeting'."
    } else if (lowerInput === "cancel" || lowerInput.includes("cancel meeting")) {
      return "To cancel a meeting: Go to the mentor card, click 'View Details', then 'Cancel Meeting'."
    } else if (lowerInput === "about" || lowerInput.includes("about us")) {
      return "Mentor Connect connects students with experienced mentors for personalized guidance. Our mission is to provide personalized guidance and career support through one-on-one mentoring sessions"
    } else if (lowerInput === "support" || lowerInput.includes("contact") || lowerInput.includes("help")) {
      return (
        <div className="support-info">
          <p>Contact support:</p>
          <p>
            <Mail size={14} className="icon" /> Email: info@mentorconnect.com
          </p>
          <p>
            <Phone size={14} className="icon" /> Phone: (123) 456-7890
          </p>
        </div>
      )
    } else {
      return "I'm not sure I understand. Please select an option below."
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="mento-bot-container">
      {/* Chat toggle button */}
      <button
        className={`chat-toggle ${isOpen ? "open" : ""}`}
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && <div className="pulse-effect"></div>}
        {!isOpen && <div className="chat-label">Chat with Mento Bot</div>}
      </button>

      {/* Chat window */}
      <div className={`chat-window ${isOpen ? "open" : ""}`}>
        <div className="chat-header">
          <div className="bot-avatar">
            <User size={24} />
          </div>
          <div className="bot-info">
            <h3>Mento Bot</h3>
            <span className="status">Online</span>
          </div>
          <button className="close-btn" onClick={toggleChat} aria-label="Close chat">
            <X size={20} />
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender === "bot" ? "bot" : "user"}`}>
              {message.sender === "bot" && (
                <div className="bot-avatar-small">
                  <User size={16} />
                </div>
              )}
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message bot">
              <div className="bot-avatar-small">
                <User size={16} />
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="quick-options">
          {quickOptions.map((option) => (
            <button key={option.id} className="quick-option-btn" onClick={() => handleQuickOption(option.id)}>
              {option.icon}
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MentoBot