# Tool Registry for OSIRIS

"""Register all OSIRIS tool implementations.
Each tool module provides a class with a `run` method that the brain can call.
"""

from .bigquery import BigQueryTool
from .earth_engine import EarthEngineTool
from .vercel import VercelDeployTool
from .email import EmailTool

# Mapping from tool name (used in prompts) to class
TOOL_REGISTRY = {
    "bigquery": BigQueryTool,
    "earth_engine": EarthEngineTool,
    "vercel_deploy": VercelDeployTool,
    "email": EmailTool,
}

def get_tool(name: str):
    """Return an instantiated tool class for *name* or raise KeyError."""
    cls = TOOL_REGISTRY.get(name)
    if not cls:
        raise KeyError(f"Tool '{name}' not registered")
    return cls()
