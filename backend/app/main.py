from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api.routes import router as api_router

app = FastAPI(
    title="CyberGuard Enterprise API",
    description="Real-time Cyberbullying Detection & Protection System",
    version="2.0.0"
)

# Ensure uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request, call_next):
    print(f"DEBUG: Incoming {request.method} request to {request.url.path}")
    response = await call_next(request)
    return response

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "status": "CyberGuard API is Online",
        "available_endpoints": [route.path for route in app.routes]
    }

@app.get("/api/v1/test")
async def test_connection():
    return {"status": "Connected to API v1"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
