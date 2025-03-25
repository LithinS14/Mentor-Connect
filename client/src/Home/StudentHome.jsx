"use client"

import { useState, useEffect } from "react"
import "./StudentHome.css"
import MentorCard from "./MentorCard"
import LoadingSpinner from "./LoadingSpinner"
import ErrorMessage from "./ErrorMessage"
import ChatBot from "./ChatBot"

const HomePage = () => {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:5000/api/studentHome/mentors") // Corrected endpoint
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

    fetchMentors()
  }, [])

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

  return (
    <div className="homepage">
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
        </div>
      </header>

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

      {/* Add the ChatBot component */}
      <ChatBot />
    </div>
  )
}

export default HomePage

