"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Auth.css"

const MentorAuth = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch("http://localhost:5000/api/mentor/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (response.ok) {
        // Redirect to MentorHome instead of showing an alert
        navigate("/mentor-home")
      } else {
        alert(data.error || "Sign in failed")
      }
    } catch (error) {
      console.error("Error during sign in:", error)
      alert("An error occurred during sign in")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-content sign-in">
        <h1>Mentor Sign In</h1>
        <form onSubmit={handleSignIn}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default MentorAuth

