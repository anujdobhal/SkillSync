# SkillSync (Smart Team Builder)

SkillSync is a full-stack web application designed for students to find complimentary teammates based on skills and interests.

## Features
- **Mock Authentication**: Easily log in by just providing a username (no passwords needed for testing).
- **Profile System**: Define your skills, interests, and experience level.
- **Team Matchmaking Algorithm**: Get suggestions for other students whose skills and interests align with yours.
- **Team Management**: Create teams, specify required roles, and easily apply to join existing teams.

## Tech Stack
- Frontend: React.js (Vite), React Router
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on default port (27017)

### 2. Environment Variables
A `.env` file has already been generated in the `backend/` directory:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/skillsync
JWT_SECRET=supersecretjwtkey_12345
FRONTEND_URL=http://localhost:5173
```

### 3. Installation
To install the dependencies for everything at once, run:
```bash
npm run install:all
```

### 4. Running the App
To start both the Node.js backend and the React frontend concurrently:
```bash
npm start
```

## Folder Structure
- `/backend`: Express API, Mongoose models, and authentication middleware.
- `/frontend`: React client, context providers, customized API hooks, and UI pages.
