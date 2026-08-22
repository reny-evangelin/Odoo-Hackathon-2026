from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, employees, attendance, time_off, payroll

app = FastAPI(
    title="HRMS Supabase Backend API",
    description="Multi-Tenant Human Resource Management System Backend API powered by Supabase",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(time_off.router)
app.include_router(payroll.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "HRMS Supabase Backend API",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
