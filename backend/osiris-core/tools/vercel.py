# Vercel Deploy Tool for OSIRIS

"""Trigger a Vercel deployment using the VERCEL_TOKEN secret.
The `run` method expects a `project` name (optional) and returns the deployment URL.
"""

import os
import subprocess
import json

class VercelDeployTool:
    def __init__(self):
        self.token = os.getenv("VERCEL_TOKEN")
        if not self.token:
            raise EnvironmentError("VERCEL_TOKEN not set in environment")

    def run(self, params: dict) -> dict:
        project = params.get("project")
        if not project:
            return {"error": "Project name required"}
        # Use Vercel CLI (assumes it is installed in the container)
        try:
            result = subprocess.run(
                ["vercel", "deploy", "--prod", "--token", self.token, "--confirm", "--scope", project],
                capture_output=True,
                text=True,
                check=True,
            )
            return {"output": result.stdout.strip()}
        except subprocess.CalledProcessError as e:
            return {"error": e.stderr.strip()}
