# Adham AgriTech v2.0 - Sentinel Core

## Overview
This update introduces the "Sentinel Core" architecture, transforming the platform into a satellite-driven intelligence system.

## Architecture
- **Frontend ("The Eye")**: React/Next.js application with Leaflet map integration for satellite imagery.
- **Backend ("The Brain")**: Python-based analysis engine using Sentinel Hub and TorchGeo (future).

## Setup

### Prerequisites
- Node.js (Frontend)
- Python 3.8+ (Backend)
- Sentinel Hub Account

### Installation

1.  **Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

2.  **Backend**
    ```bash
    cd backend
    pip install sentinelhub-py torchgeo flask
    python -m app.api.analytics
    ```

### Configuration
Create a `.env` file in the root directory with your Sentinel Hub Instance ID:
```
VITE_SENTINEL_ID=your_instance_id
```

## Features
- **Zero-Input Analysis**: Automatically calculates NDVI and soil moisture from satellite data.
- **Live Satellite Map**: Visualizes vegetation health directly on the dashboard.
- **Dark Mode DNA**: Optimized for low-light environments with "Matte Black & Vivid Green" aesthetics.
