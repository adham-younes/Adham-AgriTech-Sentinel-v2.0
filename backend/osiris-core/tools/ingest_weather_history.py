import os
import json
import logging
import datetime
import requests
from google.cloud import bigquery

# --- CONFIGURATION ---
PROJECT_ID = os.getenv("GCP_PROJECT", "adham-agritech-sentinel")
BQ_DATASET = os.getenv("BQ_DATASET", "agri_sovereign_data")
TABLE_NAME = "osiris_memory"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fetch_weather_history(lat, lon, years=10):
    """
    Fetches historical weather data from Open-Meteo Archive API.
    """
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=365 * years)
    
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "rain_sum"],
        "timezone": "auto"
    }
    
    logger.info(f"Fetching {years} years of weather history for {lat}, {lon}...")
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        logger.error(f"Failed to fetch weather: {response.text}")
        return None
        
    return response.json()

def ingest_to_memory(weather_data, location_name):
    """
    Summarizes weather trends and injects into OSIRIS Memory (BigQuery).
    """
    client = bigquery.Client(project=PROJECT_ID)
    table_id = f"{PROJECT_ID}.{BQ_DATASET}.{TABLE_NAME}"
    
    daily = weather_data.get("daily", {})
    if not daily:
         return
         
    # Generate a semantic summary suitable for RAG
    # In a real scenario, we'd chunk this more granularly
    summary = f"Weather Climate History for {location_name} (Last 10 Years). "
    summary += f"Max Temp Range: {min(daily['temperature_2m_max'])}C to {max(daily['temperature_2m_max'])}C. "
    summary += f"Total Precipitation Events recorded: {len([x for x in daily['precipitation_sum'] if x > 0])}. "
    summary += "This data is critical for trend analysis and crop suitability modeling."
    
    rows_to_insert = [
        {
            "id": f"weather_{location_name}_{datetime.date.today()}",
            "content": summary,
            "doc_type": "weather_history",
            "created_at": datetime.datetime.utcnow().isoformat()
        }
    ]
    
    errors = client.insert_rows_json(table_id, rows_to_insert)
    if errors:
        logger.error(f"Encountered errors while inserting rows: {errors}")
    else:
        logger.info(f"Successfully injected weather history for {location_name} into Sovereign Memory.")

if __name__ == "__main__":
    # Example injection for a test location (e.g., a known farm in Egypt)
    # Ideally, this script would loop through all user farms in Supabase
    LOC_LAT = 30.0444
    LOC_LON = 31.2357
    LOC_NAME = "Cairo_Pilot_Farm"
    
    data = fetch_weather_history(LOC_LAT, LOC_LON)
    if data:
        ingest_to_memory(data, LOC_NAME)
