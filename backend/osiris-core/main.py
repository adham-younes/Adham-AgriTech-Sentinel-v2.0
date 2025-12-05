import os
import json
import ee
import functions_framework
import google.generativeai as genai
from google.cloud import bigquery
from datetime import datetime

# Global initialization
model = None
bq_client = None
ee_initialized = False

def init_services():
    """Lazy initialization of all services"""
    global model, bq_client, ee_initialized
    
    # Gemini
    if model is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set")
        genai.configure(api_key=api_key)
        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "max_output_tokens": 65535,
        }
        model = genai.GenerativeModel('gemini-3-pro-preview', generation_config=generation_config)
    
    # BigQuery
    if bq_client is None:
        bq_client = bigquery.Client()
    
    # Earth Engine
    if not ee_initialized:
        project_id = os.getenv('GCP_PROJECT', 'adham-agritech-sentinel')
        ee.Initialize(project=project_id)
        ee_initialized = True
    
    return model, bq_client

@functions_framework.http
def osiris_core(request):
    """OSIRIS Supreme Integration"""
    
    # CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Initialize services
        ai_model, bq = init_services()
        
        # Parse request
        request_json = request.get_json(silent=True)
        if not request_json or 'prompt' not in request_json:
            return (json.dumps({"error": "Missing 'prompt'"}), 400, headers)
        
        prompt = request_json['prompt']
        project_id = os.getenv('GCP_PROJECT', 'adham-agritech-sentinel')
        dataset = os.getenv('BQ_DATASET', 'agri_sovereign_data')
        
        # Step 1: Earth Engine Analysis
        print(f"[EE] Analyzing: {prompt}")
        
        # Sample: Get NDVI for Cairo region
        point = ee.Geometry.Point([31.2357, 30.0444])  # Cairo
        collection = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterBounds(point) \
            .filterDate('2024-11-01', '2024-12-01') \
            .select(['B4', 'B8'])
        
        def calculate_ndvi(image):
            return image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        
        ndvi_collection = collection.map(calculate_ndvi)
        mean_ndvi = ndvi_collection.mean().reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point.buffer(1000),
            scale=10
        ).getInfo()
        
        ndvi_value = mean_ndvi.get('NDVI', 0)
        
        # Step 2: Gemini Interpretation
        analysis_prompt = f"""
        You are OSIRIS, an agricultural AI expert.
        
        I analyzed satellite data for Cairo and found:
        - Mean NDVI: {ndvi_value:.3f}
        
        User asked: "{prompt}"
        
        Provide a brief, actionable agricultural insight.
        """
        
        response = ai_model.generate_content(analysis_prompt)
        ai_response = response.text
        
        # Step 3: Log to BigQuery
        table_id = f"{project_id}.{dataset}.osiris_logs"
        
        # Create table if not exists
        schema = [
            bigquery.SchemaField("timestamp", "TIMESTAMP"),
            bigquery.SchemaField("prompt", "STRING"),
            bigquery.SchemaField("ndvi", "FLOAT"),
            bigquery.SchemaField("response", "STRING"),
        ]
        
        table = bigquery.Table(table_id, schema=schema)
        try:
            bq.create_table(table)
        except:
            pass  # Table exists
        
        # Insert log
        rows_to_insert = [{
            "timestamp": datetime.utcnow().isoformat(),
            "prompt": prompt,
            "ndvi": ndvi_value,
            "response": ai_response
        }]
        
        bq.insert_rows_json(table_id, rows_to_insert)
        
        # Step 4: Generate Maps URL
        maps_url = f"https://maps.googleapis.com/maps/api/staticmap?center=30.0444,31.2357&zoom=12&size=600x400&key={os.getenv('GOOGLE_API_KEY')}"
        
        # Return response
        return (json.dumps({
            "status": "success",
            "analysis": {
                "ndvi": round(ndvi_value, 3),
                "interpretation": ai_response,
                "map_url": maps_url
            }
        }), 200, headers)
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return (json.dumps({
            "status": "error",
            "error": str(e)
        }), 500, headers)
