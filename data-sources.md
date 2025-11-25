# Data Sources & Methodologies

## Overview
Adham AgriTech aggregates data from multiple high-fidelity sources to provide accurate, real-time agricultural insights. This document outlines the origin of our data and the methodologies used for analysis.

## 1. Satellite Imagery & Analytics
**Provider:** EOSDA (EOS Data Analytics)
- **Data Type:** Sentinel-2 & Landsat 8 satellite imagery.
- **Resolution:** 10m - 30m per pixel.
- **Update Frequency:** Every 3-5 days (depending on cloud cover).
- **Indices Calculated:**
  - **NDVI (Normalized Difference Vegetation Index):** Measures live green vegetation.
  - **NDWI (Normalized Difference Water Index):** Monitors changes in water content of leaves.
  - **RECl (Red Edge Chlorophyll Index):** Detects chlorophyll content for nitrogen management.

## 2. AI Plant Diagnostics
**Provider:** Plant.ID (Kindwise) & Custom Models
- **Methodology:** Computer vision analysis of user-uploaded photos.
- **Capabilities:**
  - Species identification.
  - Disease detection (e.g., Early Blight, Powdery Mildew).
  - Pest identification.
- **Accuracy:** >90% for common crops (Tomato, Potato, Wheat).

## 3. Weather Data
**Provider:** OpenWeatherMap / Local Sensors
- **Data Points:** Temperature, Humidity, Wind Speed, Precipitation.
- **Forecast:** 7-day hyper-local forecast.
- **Integration:** Real-time updates every hour.

## 4. Soil Analysis
**Source:** Lab Reports & IoT Sensors
- **Lab Data:** NPK values (Nitrogen, Phosphorus, Potassium), pH, EC.
- **IoT Sensors:** Real-time soil moisture and temperature readings (Simulated in V2.0 Demo).

## 5. Health Score Calculation
The "Field Health Score" (0-100) is a composite metric derived from:
- **NDVI (30%):** General vegetation health.
- **Chlorophyll (20%):** Nutrient uptake efficiency.
- **Soil Moisture (20%):** Water stress levels.
- **EVI (10%):** Enhanced Vegetation Index for high biomass areas.
- **Other Indices (20%):** NRI, DSWI, NDWI.

**Formula:**
`Score = (NDVI_norm * 0.3) + (Chl_norm * 0.2) + (Moisture_norm * 0.2) + ...`

## 6. Data Privacy
All farm data is encrypted and stored securely. Location data is used solely for providing localized analytics and is not shared with third parties without consent.
