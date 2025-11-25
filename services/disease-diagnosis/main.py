from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import random
import asyncio

# --- Configuration & Color Theme Constants ---
# These constants define the color palette to ensure UI consistency.
# They are provided here for self-documentation and potential future use in response metadata.
COLOR_THEME_PRIMARY = "#10B981"  # Emerald Green (Bright/Interactive)
COLOR_THEME_DARK = "#09090B"     # Zinc 950 (Matte Dark Background)
COLOR_SEVERITY_HIGH = "#EF4444"  # Red (High Severity)
COLOR_SEVERITY_MEDIUM = "#F59E0B" # Amber (Medium Severity)
COLOR_SEVERITY_LOW = "#10B981"   # Emerald Green (Low Severity/Healthy)

app = FastAPI(
    title="Adham AgriTech - Disease Diagnosis Microservice",
    description="AI-powered crop disease analysis service with simulated inference.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiagnosisResponse(BaseModel):
    disease_name: str
    confidence_score: float
    severity: str  # "High", "Medium", "Low"
    recommendation_id: str
    color_code: str # Helper for frontend to pick the right color immediately

@app.get("/")
async def root():
    return {"message": "Adham AgriTech Disease Diagnosis Service is running."}

@app.post("/api/v1/diagnose_image", response_model=DiagnosisResponse)
async def diagnose_image(file: UploadFile = File(...)):
    """
    Analyzes an uploaded crop image and returns a simulated diagnosis.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Simulate processing delay (async/await)
    await asyncio.sleep(1.5) 

    # --- Simulated Inference Logic ---
    # In a real scenario, we would load the model and predict here.
    # For this prototype, we simulate results based on random choice or file size/name.
    
    # Deterministic simulation based on filename length for testing consistency
    filename_len = len(file.filename) if file.filename else 0
    
    if filename_len % 3 == 0:
        # Case 1: Critical - Late Blight
        return DiagnosisResponse(
            disease_name="Late Blight (Phytophthora infestans)",
            confidence_score=0.88,
            severity="High",
            recommendation_id="REC_LB_001",
            color_code=COLOR_SEVERITY_HIGH
        )
    elif filename_len % 3 == 1:
        # Case 2: Warning - Potassium Deficiency
        return DiagnosisResponse(
            disease_name="Potassium Deficiency",
            confidence_score=0.75,
            severity="Medium",
            recommendation_id="REC_PD_002",
            color_code=COLOR_SEVERITY_MEDIUM
        )
    else:
        # Case 3: Healthy
        return DiagnosisResponse(
            disease_name="Healthy Leaf",
            confidence_score=0.99,
            severity="Low",
            recommendation_id="REC_HL_003",
            color_code=COLOR_SEVERITY_LOW
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
