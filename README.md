Mentor Connect
A platform connecting students with mentors for personalized guidance and learning.

Developed by:

Litin S

Pranav J

Mohanraj M

✨ Features

✅ User Authentication – Secure login for mentors and students.

🔍 Mentor Search – Filter mentors by expertise, availability, and ratings.

📅 Session Booking – Schedule and manage mentoring sessions.

📧 Email Notifications – Automated emails via Nodemailer for bookings & reminders.

🤖 FAQ Chatbot – Basic AI chatbot for common queries.

🛠 Tech Stack
Frontend
React.js (Frontend framework)

CSS (Custom styling)

Axios (API calls)

Backend

Node.js & Express.js (Server & API)

MongoDB (Database with Mongoose ODM)

JWT (Authentication)

Bcrypt.js (Password hashing)

Nodemailer (Email notifications)

🚀 Getting Started

Prerequisites

Node.js (v16 or later)

MongoDB (Local or MongoDB Atlas)

Git

⚙️ Setup Instructions

1. Clone the Repository

git clone https://github.com/LithinS14/Mentor-Connect.git

cd Mentor-Connect

3. Install Dependencies (Frontend & Backend)

Frontend Setup

cd client

npm install

Backend Setup

cd  server

npm install

4. Configure Environment Variables
Create a .env file in the backend folder with:

env
MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key

EMAIL_USER=your_email@gmail.com

EMAIL_PASS=your_email_app_password

(For Gmail, enable App Passwords if using 2FA.)

4. Run the Application
Start Backend Server

cd server

node server.js

Start Frontend Development Server

cd client

npm run dev

