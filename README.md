# SkillSync - Networking Platform

SkillSync is a full-stack student networking and collaboration platform that helps students discover peers, build teams, and work on projects with real-time communication.

## What It Solves

- Makes teammate discovery easier using profile and skill data
- Improves collaboration with in-app messaging and notifications
- Supports project creation, team requests, and mentor discovery in one place

## Core Features

### Profile System
- Professional student profiles with skills, interests, and social/coding links
- Profile photo upload and visibility controls
- Mentor mode with experience, bio, and expertise tags

### Networking and Team Formation
- Find teammates based on skill/domain relevance
- Send, accept, and manage connection requests
- Discover public projects and request to join teams

### Collaboration Tools
- Real-time messaging between connected users
- In-app notifications for requests and updates
- Project feeds and updates to keep teams aligned

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- shadcn/ui (Radix UI)
- Framer Motion
- React Router

### Backend and Data
- Supabase Auth
- Supabase Postgres Database
- Supabase Realtime
- Supabase Storage

### Tooling
- ESLint
- PostCSS
- npm

## Project Structure

```text
src/
  components/
  hooks/
  integrations/
    supabase/
  lib/
  pages/
public/
supabase/
  migrations/
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a .env file in project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

3. Start development server:

```bash
npm run dev
```

App URL: http://localhost:8080

## Available Scripts

- npm run dev - Start Vite dev server
- npm run build - Build for production
- npm run preview - Preview production build
- npm run lint - Run ESLint

