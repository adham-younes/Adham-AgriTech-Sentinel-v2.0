# Earth Engine Tool for OSIRIS

"""Fetch satellite raster tiles via Google Cloud Storage.
The `run` method expects `z`, `x`, `y` tile coordinates and returns raw bytes.
"""

from google.cloud import storage

class EarthEngineTool:
    def __init__(self, bucket_name: str = "earth-engine-tiles"):
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)

    def run(self, params: dict) -> dict:
        z = params.get("z")
        x = params.get("x")
        y = params.get("y")
        if None in (z, x, y):
            return {"error": "Missing tile coordinates"}
        blob_name = f"{z}/{x}/{y}.png"
        blob = self.bucket.blob(blob_name)
        if not blob.exists():
            return {"error": f"Tile {blob_name} not found"}
        data = blob.download_as_bytes()
        return {"tile": data}
