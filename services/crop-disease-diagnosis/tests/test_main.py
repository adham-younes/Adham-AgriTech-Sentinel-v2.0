"""
Tests for Crop Disease Diagnosis Service
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """Test root health check"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Crop Disease Diagnosis"
    assert data["status"] == "operational"

def test_health_check():
    """Test detailed health check"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "color_constants" in data
    assert "supported_diseases" in data

def test_diagnose_image_healthy():
    """Test diagnosis with small file (healthy scenario)"""
    # Create a small test image content
    small_content = b"x" * 1000  # Small file size for healthy diagnosis
    
    response = client.post(
        "/api/v1/diagnose_image",
        files={"file": ("test_small.jpg", small_content, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["diagnosis"]["disease_name"] == "Healthy Leaf"
    assert data["diagnosis"]["severity"] == "Low"
    assert data["diagnosis"]["confidence_score"] == 0.99
    assert "ui_colors" in data

def test_diagnose_image_late_blight():
    """Test diagnosis with large file (late blight scenario)"""
    # Create a large test image content
    large_content = b"x" * 500000  # Large file size for late blight diagnosis
    
    response = client.post(
        "/api/v1/diagnose_image",
        files={"file": ("test_large.jpg", large_content, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["diagnosis"]["disease_name"] == "Late Blight (Phytophthora infestans)"
    assert data["diagnosis"]["severity"] == "High"
    assert data["diagnosis"]["confidence_score"] == 0.88

def test_diagnose_image_potassium_deficiency():
    """Test diagnosis with medium file or leaf in name (potassium deficiency)"""
    medium_content = b"x" * 100000  # Medium file size
    
    response = client.post(
        "/api/v1/diagnose_image",
        files={"file": ("leaf_test.jpg", medium_content, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["diagnosis"]["disease_name"] == "Potassium Deficiency"
    assert data["diagnosis"]["severity"] == "Medium"
    assert data["diagnosis"]["confidence_score"] == 0.75

def test_diagnose_image_invalid_file_type():
    """Test diagnosis with unsupported file type"""
    response = client.post(
        "/api/v1/diagnose_image",
        files={"file": ("test.txt", b"test content", "text/plain")}
    )
    
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

def test_diagnose_image_too_large():
    """Test diagnosis with file too large"""
    # Create content larger than 10MB
    large_content = b"x" * (11 * 1024 * 1024)
    
    response = client.post(
        "/api/v1/diagnose_image",
        files={"file": ("test_large.jpg", large_content, "image/jpeg")}
    )
    
    assert response.status_code == 400
    assert "File size too large" in response.json()["detail"]

def test_get_recommendation_healthy():
    """Test getting recommendation for healthy plant"""
    response = client.get("/api/v1/recommendations/REC_HEALTHY_001")
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "No Treatment Needed"
    assert data["severity"] == "Low"
    assert len(data["actions"]) > 0

def test_get_recommendation_potassium():
    """Test getting recommendation for potassium deficiency"""
    response = client.get("/api/v1/recommendations/REC_K_DEF_001")
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Potassium Deficiency Treatment"
    assert data["severity"] == "Medium"
    assert "potassium sulfate" in data["actions"][0]

def test_get_recommendation_late_blight():
    """Test getting recommendation for late blight"""
    response = client.get("/api/v1/recommendations/REC_LB_001")
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Late Blight Emergency Treatment"
    assert data["severity"] == "High"
    assert "copper-based fungicide" in data["actions"][0]

def test_get_recommendation_not_found():
    """Test getting non-existent recommendation"""
    response = client.get("/api/v1/recommendations/REC_INVALID_001")
    
    assert response.status_code == 404
    assert "Recommendation not found" in response.json()["detail"]

def test_color_constants():
    """Test that color constants are properly defined"""
    response = client.get("/api/v1/health")
    data = response.json()
    colors = data["color_constants"]
    
    assert colors["COLOR_THEME_PRIMARY"] == "#10b981"
    assert colors["COLOR_THEME_DARK"] == "#0f172a"
    assert colors["COLOR_SEVERITY_HIGH"] == "#ef4444"
    assert colors["COLOR_SEVERITY_MEDIUM"] == "#f59e0b"
    assert colors["COLOR_SEVERITY_LOW"] == "#10b981"

if __name__ == "__main__":
    pytest.main([__file__])
