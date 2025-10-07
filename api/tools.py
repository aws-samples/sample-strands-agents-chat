from contextvars import ContextVar

from strands import tool

from s3 import upload_file_to_s3

# Context variable to store session workspace directory
session_workspace_context: ContextVar[str] = ContextVar("session_workspace_context", default=None)


def create_session_aware_upload_tool(session_workspace_dir: str, x_user_sub: str = None):
    """Create a session-aware upload tool with the session workspace directory"""

    @tool
    def upload_file_to_s3_and_retrieve_s3_url(filepath: str, user_sub: str = None) -> str:
        """Upload the file at session workspace and retrieve the s3 path

        Args:
            filepath: The path to the uploading file
            user_sub: User subscription ID for gallery tracking
        """
        # Use provided user_sub or fall back to the session user_sub
        effective_user_sub = user_sub or x_user_sub
        return upload_file_to_s3(filepath, session_workspace_dir, effective_user_sub)

    return upload_file_to_s3_and_retrieve_s3_url
