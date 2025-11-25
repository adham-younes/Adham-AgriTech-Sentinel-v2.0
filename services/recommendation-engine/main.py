import json
import os
from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel

# --- Configuration & Constants ---
# Color Palette Constants (Strict Adherence)
COLOR_THEME_DARK = "#1a1a1a"  # Matte Black
COLOR_THEME_PRIMARY = "#10b981"  # Vivid Green
COLOR_SEVERITY_HIGH = "#ef4444"  # Red
COLOR_SEVERITY_MEDIUM = "#f59e0b"  # Orange
COLOR_SEVERITY_LOW = "#10b981"  # Green

RECOMMENDATIONS_FILE = "recommendations.json"

# --- Data Models ---
class RecommendationColors(BaseModel):
    bg: str
    text: str
    accent: str

class RecommendationResponse(BaseModel):
    recommendation_id: str
    title: str
    title_ar: Optional[str] = None
    severity: str
    action_type: str
    steps: List[str]
    steps_ar: Optional[List[str]] = None
    safety_warning: str
    safety_warning_ar: Optional[str] = None
    colors: RecommendationColors

# --- App Initialization ---
app = FastAPI(
    title="Adham AgriTech Recommendation Engine",
    description="Agentic microservice for generating actionable agricultural recommendations.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions ---
def load_recommendations():
    """Loads recommendations from the JSON file."""
    if not os.path.exists(RECOMMENDATIONS_FILE):
        return {}
    with open(RECOMMENDATIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "Recommendation Engine is running. Use /api/v1/recommendation/{id} to get recommendations."}

@app.get("/api/v1/recommendation/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: str = Path(..., title="The ID of the recommendation to retrieve", example="REC_LB_001")
):
    """
    Retrieves a specific recommendation by its ID.
    
    **Agentic Upgrade Blueprint:**
    In the future, this endpoint will be upgraded to use Gemini Pro to *generate* 
    recommendations in real-time based on context (weather, inventory, etc.) 
    instead of just retrieving them from a static JSON file.
    """
    recommendations = load_recommendations()
    recommendation = recommendations.get(recommendation_id)

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return recommendation

# --- Execution Blueprint (Future) ---
# @app.post("/api/v1/execute_action")
# async def execute_action(action_id: str):
#     """
#     Future endpoint for the Agent to directly control IoT devices.
#     Example: PUT /api/v1/irrigation/valve_control
#     """
#     pass

if __name__ == "__main__":
    import uvicorn
    # Run on port 8001 to avoid conflict with Diagnosis Service (8000)
    uvicorn.run(app, host="0.0.0.0", port=8001)
