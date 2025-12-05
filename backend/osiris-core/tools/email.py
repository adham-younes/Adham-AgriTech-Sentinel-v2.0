# Email (Resend) Tool for OSIRIS

"""Send an email via Resend.com API.
The `run` method expects `to`, `subject`, and `html_body` keys.
"""

import os
import requests

class EmailTool:
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        if not self.api_key:
            raise EnvironmentError("RESEND_API_KEY not set in environment")
        self.endpoint = "https://api.resend.com/emails"

    def run(self, params: dict) -> dict:
        required = ["to", "subject", "html_body"]
        if not all(k in params for k in required):
            return {"error": f"Missing one of {required}"}
        headers = {"Authorization": f"Bearer {self.api_key}"}
        data = {
            "from": "no-reply@adham-agritech.com",
            "to": params["to"],
            "subject": params["subject"],
            "html": params["html_body"],
        }
        try:
            resp = requests.post(self.endpoint, json=data, headers=headers)
            resp.raise_for_status()
            return {"status": "sent", "response": resp.json()}
        except Exception as e:
            return {"error": str(e)}
