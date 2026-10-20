# CampusOrbit 🎓🚀

> **Intelligent Campus Skill Development and Internship Management Platform**

CampusOrbit is an enterprise-grade full-stack platform designed for higher education institutions to streamline academic advising, student skill verification, portfolio tracking, and campus internship recruitment workflows.

---

## 🌟 Key Features

### 👨‍🎓 1. Student Workspace
- **Academic Profile Management**: Manage department, year of study, cumulative CGPA, professional bio, and verified GitHub/LinkedIn handles.
- **Skill Stack Catalog**: Add technical proficiencies rated across **Beginner**, **Intermediate**, and **Advanced** tiers.
- **Project Showcase**: Display completed engineering projects with tech stack tags, repository links, and live demo URLs.
- **Curated Opportunity Feed**: Search and filter company drives by role type (`internship`, `research`, `placement`), location, and CGPA requirements with automated eligibility badges.
- **Application Tracking**: Monitor real-time status transitions (`Applied`, `Under Review`, `Shortlisted`, `Accepted`, `Rejected`) with cover notes submission.
- **Faculty Mentorship Feedback**: Receive personalized guidance and academic preparation advice from assigned faculty advisors.

### 👩‍🏫 2. Faculty & Mentor Console
- **Student Advisee Cohort**: Manage assigned advisee rosters with instant search by student name, institutional email, or department.
- **Comprehensive Portfolio Inspection**: Review complete student profiles, verified skill inventories, projects, and corporate application histories.
- **Mentorship Feedback & Privacy Guard**: Provide targeted feedback with a **Student Visibility Toggle** (`is_student_visible`), enabling private observations or shared guidance.
- **Advisee Cohort Management**: Assign students by institutional email with duplicate prevention and ownership enforcement.

### 💼 3. Placement Officer Console
- **Recruitment Drive Management**: Publish company opportunities with stipend details, minimum CGPA prerequisites, application deadlines, and job specifications.
- **Soft Deactivation**: Safely retire concluded opportunities without breaking applicant histories or foreign key relationships.
- **Applicant Evaluation Console**: Opportunity selector with candidate filtering, student contact details, cover notes, and inline status updates (`PATCH /api/applications/{id}/status`).

### 🛡️ 4. Security & Administration
- **Server-Side Role Guarding**: Reusable `require_roles(...)` dependency protecting all endpoints across `student`, `faculty`, `placement_officer`, and `admin`.
- **JWT Authentication**: Secure Bearer tokens with HMAC-SHA256 signatures, validated on every request via `get_current_user`.
- **Administrative CLI Tool**: Secure, interactive CLI for creating initial administrator accounts without exposing credentials in scripts.
- **Zero Secrets Leakage**: Sensitive account credentials (e.g., password hashes) are stripped from all API response models.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, React Router DOM 7 |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn |
| **Database** | PostgreSQL, Alembic (Database Migrations) |
| **Authentication & Security** | PyJWT (HMAC-SHA256), Passlib (Bcrypt), OAuth2 Password Bearer |
| **Testing** | Pytest, HTTPX / Starlette TestClient, TypeScript Compiler (`tsc`) |

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client["Client Browser (React 19 + TypeScript)"]
    Proxy["Vite Dev Proxy / Nginx Reverse Proxy"]
    FastAPI["FastAPI Application Server"]
    Auth["JWT Security & Role Dependencies"]
    DB[("PostgreSQL 15+ Database")]

    Client -->|/api/* Requests| Proxy
    Proxy -->|Reverse Proxy| FastAPI
    FastAPI -->|Token Validation & Role Check| Auth
    Auth -->|SQLAlchemy 2.0 Session| DB
```

---

## ⚙️ Local Development Setup

### Prerequisites
- **Python**: 3.11+ (Tested on Python 3.13)
- **Node.js**: 18+ or 20+
- **PostgreSQL**: 14+ installed and running locally

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/CampusOrbit.git
cd CampusOrbit
```

---

### Step 2: Backend Setup

1. **Navigate to the backend directory and create a virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate the virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your local PostgreSQL credentials:
   ```ini
   PROJECT_NAME="CampusOrbit API"
   VERSION="1.0.0"
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/campusorbit_db
   SECRET_KEY=generate_a_secure_64_character_random_string_here
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Create an initial administrator account (Optional)**:
   ```bash
   python create_admin.py --name "System Administrator" --email "admin@campusorbit.edu"
   ```

7. **Start the backend development server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The interactive Swagger documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & Verification

### Running Backend Tests
Execute the complete test suite (36 tests) covering authentication, profiles, skills, opportunities, applications, and faculty mentorship:
```bash
cd backend
pytest tests/
```

### Running Frontend Production Build
Validate TypeScript types and bundling:
```bash
cd frontend
npm run build
```

---

## 🔒 Environment Variables Reference

| Variable | Required | Description | Default / Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/campusorbit_db` |
| `SECRET_KEY` | **Yes** | Cryptographic key for signing JWTs (minimum 32 bytes) | Random 64-character string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | JWT access token lifetime | `30` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS allowed origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `PROJECT_NAME` | No | Application display name | `CampusOrbit API` |
| `VERSION` | No | API release version | `1.0.0` |

---

## 🚢 Production Deployment Guidelines

1. **Frontend Packaging**:
   - Run `npm run build` inside `frontend/` to produce the static bundle in `frontend/dist/`.
   - Host `frontend/dist/` on a static web server (e.g., Nginx, Cloudflare Pages, AWS S3 / CloudFront).

2. **Backend Execution**:
   - Run the FastAPI application using a production ASGI server with multiple worker processes:
     ```bash
     uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
     ```

3. **Reverse Proxy (Nginx Configuration Example)**:
   ```nginx
   server {
       listen 80;
       server_name campusorbit.yourdomain.edu;

       # Frontend Static Files
       location / {
           root /var/www/campusorbit/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API Proxy
       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Security Best Practices**:
   - Enforce HTTPS across all domains using Let's Encrypt SSL certificates.
   - Set a strong, randomly generated `SECRET_KEY` in production.
   - Configure `ALLOWED_ORIGINS` to include only verified institutional domains.
   - Regularly backup the PostgreSQL database.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
