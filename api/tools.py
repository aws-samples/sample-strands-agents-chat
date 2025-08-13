import json
from contextvars import ContextVar

import requests
from strands import tool

from config import TAVILY_API_KEY
from s3 import upload_file_to_s3

# Context variable to store session workspace directory
session_workspace_context: ContextVar[str] = ContextVar("session_workspace_context", default=None)


def create_session_aware_upload_tool(session_workspace_dir: str):
    """Create a session-aware upload tool with the session workspace directory"""

    @tool
    def upload_file_to_s3_and_retrieve_s3_url(filepath: str) -> str:
        """Upload the file at session workspace and retrieve the s3 path

        Args:
            filepath: The path to the uploading file
        """
        return upload_file_to_s3(filepath, session_workspace_dir)

    return upload_file_to_s3_and_retrieve_s3_url


@tool
def web_search(keyword: str) -> str:
    """Search web by using Tavily API

    Args:
        keyword: Search word
    """

    if len(TAVILY_API_KEY) == 0:
        return "Web search functionality is not available because there is no API Key."

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TAVILY_API_KEY}",
    }

    body = {
        "query": keyword,
        "search_depth": "basic",
        "include_answer": False,
        "include_images": False,
        "include_raw_content": True,
        "max_results": 5,
    }

    res = requests.post(
        "https://api.tavily.com/search",
        data=json.dumps(body, ensure_ascii=False),
        headers=headers,
    )

    return res.text
