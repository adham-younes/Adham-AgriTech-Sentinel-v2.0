# Crop Disease Diagnosis Service

## Overview
FastAPI-based microservice for AI-powered crop disease detection and analysis. This service analyzes uploaded crop images and provides instant diagnosis with treatment recommendations.

## Features
- 🚀 High-performance FastAPI architecture
- 🤖 Simulated AI model diagnosis (3 scenarios: Healthy, Potassium Deficiency, Late Blight)
- 🎨 Consistent color scheme matching Adham AgriTech theme
- 📱 Mobile-ready API endpoints
- 🔒 File validation and security
- 📊 Detailed health monitoring

## API Endpoints

### Health Check
```
GET /api/v1/health
```
Returns service status and available disease types.

### Image Diagnosis
```
POST /api/v1/diagnose_image
Content-Type: multipart/form-data
```
Upload crop image for disease analysis.

**Response Format:**
```json
{
  "success": true,
  "diagnosis": {
    "disease_name": "Late Blight (Phytophthora infestans)",
    "confidence_score": 0.88,
    "severity": "High",
    "recommendation_id": "REC_LB_001",
    "analyzed_at": "2025-11-22T09:33:00Z",
    "file_info": {
      "filename": "leaf_image.jpg",
      "size_bytes": 245760,
      "content_type": "image/jpeg"
    }
  },
  "ui_colors": {
    "severity_high": "#ef4444",
    "severity_medium": "#f59e0b",
    "severity_low": "#10b981",
    "theme_primary": "#10b981",
    "theme_dark": "#0f172a"
  }
}
```

### Treatment Recommendations
```
GET /api/v1/recommendations/{recommendation_id}
```
Get detailed treatment recommendations based on diagnosis.

## Installation & Running

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Deployment
```bash
# Build image
docker build -t crop-diagnosis-service .

# Run container
docker run -p 8000:8000 crop-diagnosis-service
```

### Cloud Deployment (Google Cloud Run)
```bash
# Deploy to Cloud Run
gcloud run deploy crop-diagnosis-service \
  --image gcr.io/your-project/crop-diagnosis-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Color Scheme Constants
The service provides consistent color constants for UI integration:

- **Primary (Emerald):** `#10b981`
- **Dark (Slate):** `#0f172a`
- **High Severity (Red):** `#ef4444`
- **Medium Severity (Amber):** `#f59e0b`
- **Low Severity (Green):** `#10b981`

## Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- Maximum file size: 10MB

## Diagnosis Scenarios
1. **Healthy Leaf** (99% confidence, Low severity)
2. **Potassium Deficiency** (75% confidence, Medium severity)
3. **Late Blight** (88% confidence, High severity)

## Integration with Adham AgriTech
This service is designed to integrate seamlessly with the main Adham AgriTech platform:
- Consistent color theming
- Mobile-responsive API design
- Fast response times (< 1 second)
- Error handling and validation
- Health monitoring endpoints

## Next Steps
- Replace simulated diagnosis with actual AI model
- Add more disease types
- Implement image preprocessing
- Add batch processing capabilities
- Integrate with Google AI Studio models
