# Rep Track

Most gym tracking apps are fine until you actually want to use them. Progress graphs, data export, custom exercises, workout history, all of these features exist but sit behind a subscription. Rep Track is a free, open source workout tracker that gives you all of it without a paywall.

## Features

**Workout Logging**
Log sets, reps, and weight in real time during your workout. Workouts are saved to your history automatically when you finish.

**Exercise Library**
Browse a library of 47 built-in exercises covering all major muscle groups. Add your own custom exercises if something is missing.

**Workout Templates**
Build templates for your regular sessions (Push Day, Pull Day, etc.) so you are not setting up from scratch each time.

**Progress Tracking**
View your volume, strength, and personal records over time through charts. See which muscle groups you are hitting and how your numbers are moving.

**Workout History**
Full log of every session you have completed, with the ability to review any past workout in detail.

**Streaks and Reminders**
Stay consistent with streak tracking and optional workout reminders.

**Data Export**
Export your workout data as a PDF or CSV at any time. Your data is yours.

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: FastAPI (Python)
- Database: PostgreSQL
- ORM: SQLAlchemy

## Getting Started

### With Docker (recommended)

```bash
git clone https://github.com/irtaza-shahzad/rep-track
cd rep-track
cp backend/.env.example backend/.env  # fill in SECRET_KEY
docker compose up
```

App runs at `http://localhost`.

### Manual Setup

**Backend**

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and SECRET_KEY
pip install -r requirements.txt
python scripts/init_db.py   # creates tables and seeds exercises
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local  # set VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

## Live Demo

Frontend: https://rep-track-five.vercel.app