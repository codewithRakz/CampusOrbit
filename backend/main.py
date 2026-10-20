import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, profiles, opportunities, applications, faculty

app = FastAPI(
    title="CampusOrbit API",
    description="Intelligent Campus Skill Development and Internship Management Platform",
    version="1.0.0"
)

origins_env = os.getenv("ALLOWED_ORIGINS")
if origins_env:
    allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(opportunities.router)
app.include_router(applications.router)
app.include_router(faculty.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CampusOrbit API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "configured"}
