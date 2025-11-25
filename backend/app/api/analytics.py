from flask import Flask, jsonify, request
from app.services.sentinel_engine import engine
from app.services.tasks import tasks
from app.services.esoda_service import esoda

app = Flask(__name__)

@app.route('/api/analytics', methods=['POST'])
@app.route('/api/cron/analytics', methods=['POST'])
def get_analytics():
    data = request.json
    coords = data.get('polygon_coords')
    
    # 1. Trigger Background Task (Zero-Input Flow)
    # In a real app, this might be async, but for the demo we wait
    result = tasks.enqueue('process_satellite_pass', field_id='demo_field', polygon_coords=coords)
    
    # 2. Enrich with ESODA Statistics
    stats = esoda.get_statistics(coords)
    result['esoda_stats'] = stats
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
