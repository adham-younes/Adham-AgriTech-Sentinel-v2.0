# BigQuery Tool for OSIRIS

"""Provides a simple wrapper around Google Cloud BigQuery.
The `run` method expects a dict with a `query` key containing the SQL string.
"""

from google.cloud import bigquery

class BigQueryTool:
    def __init__(self):
        # Uses Application Default Credentials (service account)
        self.client = bigquery.Client()

    def run(self, params: dict) -> dict:
        query = params.get("query")
        if not query:
            return {"error": "No query provided"}
        try:
            job = self.client.query(query)
            rows = [dict(row) for row in job]
            return {"result": rows}
        except Exception as e:
            return {"error": str(e)}
