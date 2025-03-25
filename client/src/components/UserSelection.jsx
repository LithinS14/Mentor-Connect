import { Link } from "react-router-dom"
import "./UserSelection.css"

const UserSelection = () => {
  return (
    <div className="user-selection">
      <div className="user-selection-content">
        <h1>Are you a Student or a Mentor?</h1>
        <div className="user-options">
          <Link to="/student" className="user-option student">
            <h2>Student</h2>
            <p>I'm here to learn and grow</p>
          </Link>
          <Link to="/mentor" className="user-option mentor">
            <h2>Mentor</h2>
            <p>I'm here to share my knowledge</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UserSelection

