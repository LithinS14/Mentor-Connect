"use client"

import { useState, useEffect } from "react"
import "./LandingPage.css"

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 20)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Check initial scroll position

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute("href")
      if (href?.startsWith("#")) {
        e.preventDefault()
        const element = document.querySelector(href)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      }
    }

    const links = document.querySelectorAll('a[href^="#"]')
    links.forEach((link) => link.addEventListener("click", handleAnchorClick))

    return () => {
      links.forEach((link) => link.removeEventListener("click", handleAnchorClick))
    }
  }, [])

  return (
    <div className="landing-page">
      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="navbar-content">
          <a href="/" className="logo">
            MentorConnect
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h1>Connect with Industry Experts</h1>
          <p>Accelerate your career growth through personalized mentorship and skill-building</p>
          <a href="/user-selection" className="btn btn-primary btn-large">
            Get Started
          </a>
        </div>
      </header>

      <section id="features" className="features">
        <h2>Key Features</h2>
        <div className="feature-list">
          {[
            {
              icon: "📅",
              title: "Automated Booking",
              description: "Effortlessly schedule meetings that sync with mentor availability.",
            },
            {
              icon: "🎥",
              title: "Video Calls",
              description: "Connect seamlessly with built-in video calls and resource sharing.",
            },
            {
              icon: "🤝",
              title: "Smart Matching",
              description: "Find the perfect mentor based on your career goals and their expertise.",
            },
            {
              icon: "📚",
              title: "Skill Development",
              description: "Receive personalized guidance to grow your career and learn new skills.",
            },
            {
              icon: "💬",
              title: "Chat-bot",
              description: "Get quick advice and support through our Chat-bot",
            },
          ].map((feature, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to accelerate your career?</h2>
        <p>Join MentorConnect today and start your journey towards professional success.</p>
        <a href="/" className="btn btn-primary btn-large">
          Get Started Now
        </a>
      </section>

      <section id="testimonials" className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial-list">
          {[
            {
              name: "Sarah J.",
              role: "Software Engineer",
              quote:
                "MentorConnect helped me land my dream job at a top tech company. The guidance I received was invaluable.",
            },
            {
              name: "Michael T.",
              role: "Marketing Specialist",
              quote:
                "The mentors on this platform are true experts. I've learned more in a few months than I did in years on my own.",
            },
            {
              name: "Emily R.",
              role: "UX Designer",
              quote:
                "The skill-building resources and personalized mentorship have dramatically improved my design process.",
            },
          ].map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p>"{testimonial.quote}"</p>
              <h4>{testimonial.name}</h4>
              <p>{testimonial.role}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>MentorConnect</h3>
            <p>Empowering careers through expert mentorship.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>Email: info@mentorconnect.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 MentorConnect | All Rights Reserved</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

