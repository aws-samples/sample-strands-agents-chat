from fastapi import APIRouter

from models import S3File
from s3 import generate_download_url, generate_upload_url

router = APIRouter(prefix="/api/file", tags=["file"])


@router.post("/upload")
def s3_upload_url(request: S3File):
    url = generate_upload_url(request.key)
    return url


@router.post("/download")
def s3_download_url(request: S3File):
    url = generate_download_url(request.key)
    return url
