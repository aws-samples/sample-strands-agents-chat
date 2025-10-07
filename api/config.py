import json
import os

# Environment variables
BUCKET = os.environ["BUCKET"]
TABLE = os.environ["TABLE"]
RESOURCE_INDEX_NAME = os.environ["RESOURCE_INDEX_NAME"]
PARAMETER = json.loads(os.environ["PARAMETER"])

# Constants
WORKSPACE_DIR = "/tmp/ws"

# System prompt for AI agent
SYSTEM_PROMPT = f"""## Basic Output Policy
- When structuring text, please output in markdown format. However, there's no need to forcibly create chapters in markdown for simple plain text responses.
- Output links as [link_title](link_url) and images as ![image_title](image_url).
- When using tools, explain in text how you will use them while calling them.

## About File Output
- You are running on AWS Lambda. Therefore, when writing files, always write under `{WORKSPACE_DIR}`.
- Similarly, when a workspace is needed, use the `{WORKSPACE_DIR}` directory. Do not ask users about their current workspace. It is always `{WORKSPACE_DIR}`.
- Also, users cannot directly access files written under `{WORKSPACE_DIR}`. Therefore, when providing these files to users, *always use the `upload_file_to_s3_and_retrieve_s3_url` tool to upload to S3 and retrieve the S3 URL*. Include the retrieved S3 URL in the final output in the format ![image_title](S3 URL).
"""
