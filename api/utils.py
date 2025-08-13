import base64
import json
import os
import shutil
from uuid import uuid4


def str_to_base64(s: str):
    return base64.b64encode(s.encode("utf-8")).decode("utf-8")


def base64_to_str(b: str):
    return base64.b64decode(b.encode("utf-8")).decode("utf-8")


def stream_chunk(text):
    return json.dumps({"text": text}, ensure_ascii=False) + "\n"


def generate_session_id() -> str:
    """Generate a unique session ID"""
    return str(uuid4())


def create_session_workspace(session_id: str, base_workspace_dir: str) -> str:
    """Create a session-specific workspace directory

    Args:
        session_id: Unique session identifier
        base_workspace_dir: Base workspace directory (e.g., /tmp/ws)

    Returns:
        Path to the session workspace directory
    """
    session_workspace = os.path.join(base_workspace_dir, session_id)
    os.makedirs(session_workspace, exist_ok=True)
    return session_workspace


def cleanup_session_workspace(session_id: str, base_workspace_dir: str) -> None:
    """Clean up session-specific workspace directory

    Args:
        session_id: Unique session identifier
        base_workspace_dir: Base workspace directory (e.g., /tmp/ws)
    """
    session_workspace = os.path.join(base_workspace_dir, session_id)
    if os.path.exists(session_workspace):
        shutil.rmtree(session_workspace)


def generate_session_system_prompt(session_workspace_dir: str) -> str:
    """Generate system prompt with session-specific workspace directory

    Args:
        session_workspace_dir: Session-specific workspace directory

    Returns:
        System prompt with session workspace directory
    """
    return f"""## Basic Output Policy
- When structuring text, please output in markdown format. However, there's no need to forcibly create chapters in markdown for simple plain text responses.
- Output links as [link_title](link_url) and images as ![image_title](image_url).
- When using tools, explain in text how you will use them while calling them.

## About File Output
- You are running on AWS Lambda. Therefore, when writing files, always write under `{session_workspace_dir}`.
- Similarly, when a workspace is needed, use the `{session_workspace_dir}` directory. Do not ask users about their current workspace. It is always `{session_workspace_dir}`.
- Also, users cannot directly access files written under `{session_workspace_dir}`. Therefore, when providing these files to users, *always use the `upload_file_to_s3_and_retrieve_s3_url` tool to upload to S3 and retrieve the S3 URL*. Include the retrieved S3 URL in the final output in the format ![image_title](S3 URL).
"""


def handle_error_and_stream(error: Exception) -> str:
    """Convert error to appropriate message and return in stream_chunk format"""
    error_message = ""

    # Bedrock related errors
    if "ServiceUnavailableException" in str(error) or "throttling" in str(error).lower():
        error_message = "Sorry, the AI service is currently experiencing high traffic. Please try again in a few moments."
    elif "ValidationException" in str(error):
        error_message = "There's an issue with the request format. Please check your input."
    elif "AccessDeniedException" in str(error):
        error_message = "Access denied. Please contact your administrator."
    elif "ResourceNotFoundException" in str(error):
        error_message = "The specified resource was not found."
    # Network related errors
    elif "ConnectionError" in str(error) or "TimeoutError" in str(error):
        error_message = "Network connection issue occurred. Please try again in a few moments."
    # General errors
    else:
        error_message = f"An unexpected error occurred: {str(error)}"

    return stream_chunk(error_message)
