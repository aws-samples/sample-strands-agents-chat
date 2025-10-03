import os
from datetime import datetime
from uuid import uuid4

import boto3
from botocore.client import Config

from config import BUCKET, WORKSPACE_DIR


def get_s3_client():
    return boto3.client(
        "s3",
        region_name=os.environ["AWS_REGION"],
        config=Config(signature_version="s3v4"),
    )


def generate_upload_url(key: str) -> str:
    s3 = get_s3_client()
    url = s3.generate_presigned_url("put_object", Params={"Bucket": BUCKET, "Key": key})
    return url


def generate_download_url(key: str) -> str:
    s3 = get_s3_client()
    url = s3.generate_presigned_url("get_object", Params={"Bucket": BUCKET, "Key": key})
    return url


def download_s3_file_on_memory(key: str) -> bytes:
    s3 = get_s3_client()
    dl_obj = s3.get_object(Bucket=BUCKET, Key=key)
    dl_obj_binary = dl_obj["Body"].read()
    return dl_obj_binary


def upload_file_to_s3(filepath: str, session_workspace_dir: str = None, x_user_sub: str = None) -> str:
    """Upload the file at session workspace and retrieve the s3 path

    Args:
        filepath: The path to the uploading file
        session_workspace_dir: Session-specific workspace directory for validation
        x_user_sub: User subscription ID for gallery tracking
    """
    region = os.environ["AWS_REGION"]

    # If session_workspace_dir is provided, validate against it
    # Otherwise, fall back to the original WORKSPACE_DIR validation for backward compatibility
    if session_workspace_dir:
        if not filepath.startswith(session_workspace_dir):
            raise ValueError(f"{filepath} does not appear to be a file under the session workspace directory {session_workspace_dir}. Files to be uploaded must exist under the session workspace.")
    else:
        if not filepath.startswith(WORKSPACE_DIR):
            raise ValueError(f"{filepath} does not appear to be a file under the {WORKSPACE_DIR} directory. Files to be uploaded must exist under {WORKSPACE_DIR}.")

    datetime_prefix = datetime.now().strftime("%Y%m%d")
    random_prefix = str(uuid4())
    filename = os.path.basename(filepath)
    key = f"{datetime_prefix}/{random_prefix}_{filename}"

    s3 = boto3.client("s3")
    s3.upload_file(filepath, BUCKET, key)
    s3_url = f"https://{BUCKET}.s3.{region}.amazonaws.com/{key}"

    # Record in gallery if user_sub is provided
    if x_user_sub:
        from database import create_gallery_item_in_db

        create_gallery_item_in_db(BUCKET, key, region, filename, x_user_sub)

    return s3_url
