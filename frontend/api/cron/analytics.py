from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {
            "status": "success",
            "message": "Cron job executed successfully (Mock)",
            "details": "Backend logic skipped in frontend deployment. Full implementation requires backend deployment.",
            "data": {
                "processed": True,
                "provider": "EOSDA"
            }
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def do_GET(self):
        self.do_POST()
