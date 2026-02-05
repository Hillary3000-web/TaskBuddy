# TaskBuddy

TaskBuddy is a task management application that helps you organize your daily goals and track your productivity streaks.

## Tech Stack

- **Backend**: Django (Python) + Django Rest Framework
- **Frontend**: React (Vite) + TailwindCSS
- **Database**: SQLite (Local), PostgreSQL (Production)

## Project Structure

```
Taskbuddy/
├── frontend/           # React Frontend
├── taskbuddy/          # Django Backend
├── render.yaml         # Render Deployment Configuration
└── README.md           # Project Documentation
```

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 16+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd taskbuddy
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Mac/Linux:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the server:
   ```bash
   python manage.py runserver
   ```
   The backend runs at `http://127.0.0.1:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend runs at `http://localhost:5173`.

## Deployment

This project is configured for deployment on [Render](https://render.com).

1. Push this repository to GitHub/GitLab.
2. Log in to Render and create a new **Blueprint**.
3. Connect your repository.
4. Render will automatically detect `render.yaml` and set up the backend (Web Service), frontend (Static Site), and database (PostgreSQL).
