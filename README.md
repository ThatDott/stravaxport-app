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
| **Frontend** | Angular (TypeScript) |
| **Backend** | Python (FastAPI) |
| **Database** | PostgreSQL |
| **Auth** | Strava OAuth 2.0 & JWT |
| **Deployment** | Vercel / Render |

## Key Features
* **OAuth 2.0 Integration:** Securely connect to your Strava profile.
* **Geographical Data API:** Internal service providing comparisons to Philippine and global landmarks.
* **AI Insights Generator:** Natural-language summaries of performance trends.
* **Image Export Service:** Dynamic generation of PNG/JPEG cards for Instagram, Facebook, or X.
* **Interactive Dashboard:** Weekly and monthly performance overviews.

## API Endpoints (SOA)
The system exposes a RESTful interface documented via Swagger/OpenAPI.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/auth/strava/login` | Initiate Strava OAuth flow |
| `GET` | `/activities` | List user activities (JWT required) |
| `GET` | `/activities/{id}/comparisons` | Fetch geographical landmark comparisons |
| `POST` | `/export/image` | Generate shareable PNG export |

## System Architecture
The project follows **Service-Oriented Architecture (SOA)** principles:
1.  **Loose Coupling:** Independent services for data retrieval, AI processing, and image rendering.
2.  **Service Composition:** Combines Strava API, Quote APIs, and internal Geo-services.
3.  **Statelessness:** Uses JWT for session management.

## The Team
* **Cristieneil Ceballos**
* **Precious Mae Jomuad**
* **Janelle Ojanola**
* **Justin Dominic Veloso**

*Submitted to: Asst. Prof. Vicente B. Calag (CMSC 186)*

## Running the Project

**Prerequisites**
- Python 3.12
- Node.js & npm
- A configured `backend/.env` file with your Strava OAuth credentials, database connection string, and Gemini API credentials

**Spin up the database (Docker)**
```bash
docker compose up
```
This starts a PostgreSQL 16 instance on port `5432`.

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
ng serve
```
Then open `http://localhost:4200`.

## License
This project is for educational purposes under the CMSC 186 Web Services course.
