"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Auth.css"

const StudentAuth = () => {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="auth-container">
      <div className={`auth-content ${!isSignUp ? "sign-in" : ""}`}>
        <h1>{isSignUp ? "Student Sign Up" : "Student Sign In"}</h1>
        {isSignUp ? <StudentSignUp /> : <StudentSignIn />}
        <div className="auth-toggle">
          <p>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button onClick={() => setIsSignUp(!isSignUp)} className="toggle-auth">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

const StudentSignIn = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError("")

    try {
      // Step 1: Sign in and get studentId
      const response = await fetch("http://localhost:5000/api/student/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed")
      }

      // Store student ID in localStorage
      if (data.studentId) {
        localStorage.setItem("studentId", data.studentId)
        localStorage.setItem("studentEmail", email) // Store email for later use

        // Step 2: Fetch complete student profile
        try {
          const profileResponse = await fetch(`http://localhost:5000/api/studentHome/student/${data.studentId}`)
          const profileData = await profileResponse.json()

          if (profileResponse.ok) {
            // Store complete student profile in localStorage
            localStorage.setItem("studentProfile", JSON.stringify(profileData))
          }
        } catch (profileError) {
          console.error("Error fetching student profile:", profileError)
          // Continue even if profile fetch fails
        }

        navigate("/student-home")
      } else {
        throw new Error("Student ID not returned from server")
      }
    } catch (error) {
      console.error("Error during sign in:", error)
      setError(error.message || "An error occurred during sign in")
    }
  }

  return (
    <form onSubmit={handleSignIn}>
      {error && <div className="error-message">{error}</div>}
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
  )
}

const StudentSignUp = () => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [age, setAge] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [educationLevel, setEducationLevel] = useState("")
  const [currentSchool, setCurrentSchool] = useState("")
  const [goals, setGoals] = useState("")
  const [areasOfInterest, setAreasOfInterest] = useState([])
  const [otherInterest, setOtherInterest] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const interestAreas = [
    "Web Development",
    "Mobile Development",
    "DevOps",
    "AI/Machine Learning",
    "Web3/Blockchain",
    "Data Science",
    "Cybersecurity",
    "UI/UX Design",
    "Finance",
    "Marketing",
    "Project Management",
    "Other",
  ]

  const handleInterestChange = (area) => {
    if (areasOfInterest.includes(area)) {
      setAreasOfInterest(areasOfInterest.filter((item) => item !== area))
    } else {
      setAreasOfInterest([...areasOfInterest, area])
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const formData = {
      firstName,
      lastName,
      email,
      password,
      age,
      phoneNumber,
      educationLevel,
      currentSchool,
      goals,
      areasOfInterest,
      otherInterest,
    }

    try {
      const response = await fetch("http://localhost:5000/api/student/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (response.ok) {
        setSuccess("Sign up successful! You can now sign in.")
        // Reset form
        setFirstName("")
        setLastName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setAge("")
        setPhoneNumber("")
        setEducationLevel("")
        setCurrentSchool("")
        setGoals("")
        setAreasOfInterest([])
        setOtherInterest("")
      } else {
        setError(data.error || "Sign up failed")
      }
    } catch (error) {
      console.error("Error during sign up:", error)
      setError("An error occurred during sign up")
    }
  }

  return (
    <form className="signup-form" onSubmit={handleSignUp}>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />
      <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input
        type="password"
        placeholder="Create Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required />
      <input
        type="tel"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
      />
      <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} required>
        <option value="">Select Education Level</option>
        <option value="high_school">High School</option>
        <option value="bachelors">Bachelor's Degree</option>
        <option value="masters">Master's Degree</option>
        <option value="phd">Ph.D.</option>
      </select>
      <input
        type="text"
        placeholder="Current School/University"
        value={currentSchool}
        onChange={(e) => setCurrentSchool(e.target.value)}
        required
      />
      <div className="description-section">
        <textarea
          placeholder="Brief description of your goals and what you hope to achieve through mentorship"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows="4"
          required
        ></textarea>
      </div>
      <div className="interest-section">
        <label>Areas of Interest (Select multiple):</label>
        <div className="interest-options">
          {interestAreas.map((area) => (
            <label key={area} className="interest-option">
              <input
                type="checkbox"
                checked={areasOfInterest.includes(area)}
                onChange={() => handleInterestChange(area)}
              />
              {area}
            </label>
          ))}
        </div>
        {areasOfInterest.includes("Other") && (
          <input
            type="text"
            placeholder="Specify your interest"
            value={otherInterest}
            onChange={(e) => setOtherInterest(e.target.value)}
            required
            className="other-input"
          />
        )}
      </div>
      <button type="submit" className="submit-btn">
        Sign Up
      </button>
    </form>
  )
}

export default StudentAuth

