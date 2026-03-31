# SkillSync (Smart Team Builder)

SkillSync is a full-stack web application for students to connect with compatible teammates based on skills, interests, and project goals.

## Features
- **Mock Authentication**: Log in with a username for quick testing.
- **Profile System**: Create and update your skills, interests, and experience.
- **Team Matchmaking**: Discover students whose profiles complement yours.
- **Team Management**: Create teams, specify roles, and join existing teams.

## Tech Stack
- Frontend: React.js + Vite
- Backend: Node.js + Express
- Database: MongoDB with Mongoose
- Communication: Axios
- State: React context

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`

### 1. Install Dependencies
From the project root:
```bash
npm run install:all
```

If you prefer to install manually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Variables
A `.env` file is expected in the `backend/` directory. Example values:
```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skillsync
JWT_SECRET=supersecretjwtkey_12345
FRONTEND_URL=http://localhost:5173
```

### 3. Start the App
From the project root, run:
```bash
npm start
```

This launches:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Alternative Start Commands
- Start only backend:
```bash
cd backend && node server.js
```
- Start only frontend:
```bash
cd frontend && npm run dev
```

## Project Structure
- `backend/` - Express API, routes, controllers, models, and auth middleware.
- `frontend/` - React app, pages, components, styles, and API client.

## Notes
- The root project uses `concurrently` to run both frontend and backend together.
- Make sure MongoDB is running before starting the application.
