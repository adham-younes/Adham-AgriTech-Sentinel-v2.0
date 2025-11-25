"""
Crop Disease Diagnosis Microservice
FastAPI-based service for analyzing crop disease images
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import os
import random
from typing import Dict, Any
import uuid
from datetime import datetime

app = FastAPI(
    title="Crop Disease Diagnosis Service",
    description="AI-powered crop disease detection and analysis",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Color constants for UI consistency
COLOR_CONSTANTS = {
    "COLOR_THEME_PRIMARY": "#10b981",  # Emerald green
    "COLOR_THEME_DARK": "#0f172a",     # Dark slate
    "COLOR_SEVERITY_HIGH": "#ef4444",   # Red
    "COLOR_SEVERITY_MEDIUM": "#f59e0b", # Amber
    "COLOR_SEVERITY_LOW": "#10b981",   # Green (same as primary)
}

# Simulated disease database
DISEASE_DATABASE = {
    "healthy": {
        "name": "Healthy Leaf",
        "confidence": 0.99,
        "severity": "Low",
        "recommendation_id": "REC_HEALTHY_001"
    },
    "potassium_deficiency": {
        "name": "Potassium Deficiency",
        "confidence": 0.75,
        "severity": "Medium",
        "recommendation_id": "REC_K_DEF_001"
    },
    "late_blight": {
        "name": "Late Blight (Phytophthora infestans)",
        "confidence": 0.88,
        "severity": "High",
        "recommendation_id": "REC_LB_001"
    }
}

async def simulate_diagnosis(file_size: int, filename: str) -> Dict[str, Any]:
    """
    Simulate AI model diagnosis based on file characteristics
    """
    # Simulate processing time
    await asyncio.sleep(0.5)
    
    # Simulate different diagnoses based on file characteristics
    if file_size < 50000:  # Small file
        return DISEASE_DATABASE["healthy"]
    elif "leaf" in filename.lower() or file_size < 200000:  # Medium file or leaf in name
        return DISEASE_DATABASE["potassium_deficiency"]
    else:  # Large file
        return DISEASE_DATABASE["late_blight"]

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Crop Disease Diagnosis",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/v1/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "model_status": "simulated",
        "color_constants": COLOR_CONSTANTS,
        "supported_diseases": list(DISEASE_DATABASE.keys())
    }

@app.post("/api/v1/diagnose_image")
async def diagnose_image(file: UploadFile = File(...)):
    """
    Analyze uploaded crop image for disease detection
    
    Args:
        file: Uploaded image file (JPEG, PNG)
        
    Returns:
        JSON response with diagnosis results
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/jpg"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size (max 10MB)
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum size: 10MB"
            )
        
        # Simulate AI diagnosis
        diagnosis_result = await simulate_diagnosis(file_size, file.filename)
        
        # Build response
        response = {
            "success": True,
            "diagnosis": {
                "disease_name": diagnosis_result["name"],
                "confidence_score": diagnosis_result["confidence"],
                "severity": diagnosis_result["severity"],
                "recommendation_id": diagnosis_result["recommendation_id"],
                "analyzed_at": datetime.utcnow().isoformat(),
                "file_info": {
                    "filename": file.filename,
                    "size_bytes": file_size,
                    "content_type": file.content_type
                }
            },
            "ui_colors": {
                "severity_high": COLOR_CONSTANTS["COLOR_SEVERITY_HIGH"],
                "severity_medium": COLOR_CONSTANTS["COLOR_SEVERITY_MEDIUM"],
                "severity_low": COLOR_CONSTANTS["COLOR_SEVERITY_LOW"],
                "theme_primary": COLOR_CONSTANTS["COLOR_THEME_PRIMARY"],
                "theme_dark": COLOR_CONSTANTS["COLOR_THEME_DARK"]
            }
        }
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during image analysis: {str(e)}"
        )

@app.get("/api/v1/recommendations/{recommendation_id}")
async def get_recommendation(recommendation_id: str):
    """
    Get treatment recommendations based on recommendation ID
    
    Args:
        recommendation_id: Unique identifier for recommendation
        
    Returns:
        JSON response with treatment recommendations
    """
    recommendations = {
        "REC_HEALTHY_001": {
            "title": "No Treatment Needed",
            "description": "The plant appears healthy. Continue regular monitoring.",
            "actions": [
                "Maintain regular watering schedule",
                "Monitor for any changes",
                "Continue preventive care"
            ],
            "severity": "Low"
        },
        "REC_K_DEF_001": {
            "title": "Potassium Deficiency Treatment",
            "description": "Apply potassium-rich fertilizer to address deficiency.",
            "actions": [
                "Apply potassium sulfate (K2SO4) at 2-3 kg per hectare",
                "Increase soil pH if below 6.0",
                "Monitor leaf color improvement in 7-10 days",
                "Consider foliar spray for quick results"
            ],
            "severity": "Medium"
        },
        "REC_LB_001": {
            "title": "Late Blight Emergency Treatment",
            "description": "Immediate action required to prevent spread of late blight.",
            "actions": [
                "Apply copper-based fungicide immediately",
                "Remove and destroy infected plant parts",
                "Improve air circulation and reduce humidity",
                "Consider resistant varieties for next season",
                "Monitor neighboring plants for early symptoms"
            ],
            "severity": "High"
        }
    }
    
    if recommendation_id not in recommendations:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    return {
        "recommendation_id": recommendation_id,
        "title": recommendations[recommendation_id]["title"],
        "description": recommendations[recommendation_id]["description"],
        "actions": recommendations[recommendation_id]["actions"],
        "severity": recommendations[recommendation_id]["severity"],
        "issued_at": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
