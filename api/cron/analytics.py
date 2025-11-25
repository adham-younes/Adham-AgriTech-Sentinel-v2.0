#!/usr/bin/env python3
"""Vercel Serverless Function for /api/cron/analytics
This file proxies to the existing Flask analytics endpoint.
"""
import json
from backend.app.api.analytics import get_analytics

def handler(event, context):
    # Vercel passes request body as JSON string in event["body"]
    body = json.loads(event.get("body", "{}"))
    # Mock Flask request object
    class MockRequest:
        def __init__(self, json_data):
            self.json = json_data
    # Temporarily replace Flask's request with mock
    from flask import request as flask_request
    original_request = flask_request
    try:
        # Monkey‑patch Flask request for the duration of the call
        from flask import request as flask_request
        flask_request = MockRequest(body)
        response = get_analytics()
        return {
            "statusCode": response.status_code,
            "headers": {"Content-Type": "application/json"},
            "body": response.get_data(as_text=True),
        }
    finally:
        # Restore original request
        flask_request = original_request
