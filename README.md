# StravaXport: The Social Runner

**StravaXport** is a web-based service designed to transform raw Strava activity data into highly customizable, shareable social media content. Developed as a Web Services and SOA project, it bridges the gap between technical performance metrics and creative storytelling.

<img width="952" height="535" alt="image" src="https://github.com/user-attachments/assets/99f95057-3b7a-4332-8ce2-f9095f754953" />

## Overview
While Strava provides excellent data tracking, its visualization options are often rigid. StravaXport allows athletes to:
- **Visualize Progress:** Compare distances to real-world landmarks (e.g., "You climbed the equivalent of Mt. Apo this week").
- **Custom Summaries:** Generate on-demand recaps for any timeframe, not just year-end.
- **Social Ready:** Export activity logs as polished, branded images with motivational overlays.

## Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 21 (TypeScript, Signals, OnPush CD) |
| **Backend** | Python 3.12 (FastAPI, SQLAlchemy async) |
| **Database** | PostgreSQL 16 |
| **Auth** | Strava OAuth 2.0 & JWT |
| **AI** | Google Gemini 2.5 Flash |
| **Deployment** | Vercel / Render |

## Key Features
- **OAuth 2.0 Integration:** Securely connect to your Strava profile.
- **Geographical Data API:** Internal service providing comparisons to Philippine and global landmarks.
- **AI Insights Generator:** Natural-language summaries of performance trends.
- **Image Export Service:** Dynamic generation of PNG/JPEG cards for Instagram, Facebook, or X.
- **Interactive Dashboard:** Weekly and monthly performance overviews with date-range filtering.

## System Architecture
The project follows **Service-Oriented Architecture (SOA)** principles:
1. **Loose Coupling:** Independent services for data retrieval, AI processing, and image rendering.
2. **Service Composition:** Combines Strava API, Quote APIs, and internal Geo-services.
3. **Statelessness:** Uses JWT for session management.

## Prerequisites
- Python 3.12+
- Node.js & npm
- Docker & Docker Compose
- A [Strava API application](https://www.strava.com/settings/api) (free)

> **Important:** The Strava API only allows **one athlete per application** in development mode. Each person setting up this project must create their own Strava API application at [https://www.strava.com/settings/api](https://www.strava.com/settings/api) to get their own `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`. Set the "Authorization Callback Domain" in your Strava app settings to `localhost`.

## Environment Variables

Copy this template into `backend/.env` and fill in your values:

```env
# App
PROJECT_NAME=Stravaxport API
VERSION=1.0.0

# Strava OAuth — required, get yours at https://www.strava.com/settings/api
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
# Defaults to http://localhost:4200/auth/callback — change for production
# STRAVA_REDIRECT_URI=http://localhost:4200/auth/callback

# JWT — required, generate a random secret
SECRET_KEY=generate_a_random_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database — required, must match docker-compose.yml
DATABASE_URL=postgresql+asyncpg://postgres:mysecretpassword@localhost:5432/stravaxport

# Quotes (API-Ninjas) — optional, leave empty to skip
QUOTES_API_URL=https://api.api-ninjas.com/v2/quotes
QUOTES_API_KEY=your_quotes_api_key

# AI Insights (Google Gemini) — optional, leave empty for rule-based fallback
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
INSIGHTS_MAX_TOKENS=8192
INSIGHTS_MAX_ACTIVITIES=50
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `STRAVA_CLIENT_ID` | Yes | From your Strava API app settings |
| `STRAVA_CLIENT_SECRET` | Yes | From your Strava API app settings |
| `STRAVA_REDIRECT_URI` | No | Default: `http://localhost:4200/auth/callback`. Set to your deployed frontend URL in production |
| `SECRET_KEY` | Yes | Random string for JWT signing (e.g. `openssl rand -hex 32`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `QUOTES_API_KEY` | No | [API-Ninjas](https://api-ninjas.com/) key for motivational quotes |
| `GEMINI_API_KEY` | No | [Google AI Studio](https://aistudio.google.com/) key for AI insights |
| `GEMINI_MODEL` | No | Default: `gemini-2.5-flash` |
| `INSIGHTS_MAX_TOKENS` | No | Default: `8192` (increase if Gemini truncates output) |
| `INSIGHTS_MAX_ACTIVITIES` | No | Default: `50` (max activities sent to Gemini per request) |

## Running the Project

### 1. Start the database
```bash
docker compose up
```
This starts PostgreSQL 16 on port `5432`.

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```
The API runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend
```bash
cd frontend
npm install
ng serve
```
Open `http://localhost:4200`.

## API Endpoints (SOA)
The system exposes a RESTful interface documented via Swagger/OpenAPI.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/auth/strava/login` | Initiate Strava OAuth flow |
| `GET` | `/activities` | List user activities (JWT required) |
| `GET` | `/activities/{id}/comparisons` | Fetch geographical landmark comparisons |
| `POST` | `/export/image` | Generate shareable PNG export |

Full documentation is available at `http://localhost:8000/docs` when the backend is running.

## The Team
- **Cristieneil Ceballos**
- **Precious Mae Jomuad**
- **Janelle Ojanola**
- **Justin Dominic Veloso**

*Submitted to: Asst. Prof. Vicente B. Calag (CMSC 186)*

## License
This project is for educational purposes under the CMSC 186 Web Services course.
