from fastapi import APIRouter, Header, HTTPException, Query

from database import get_gallery_items_from_db

router = APIRouter()


@router.get("/api/gallery", response_model=dict)
def get_gallery_items(x_user_sub: str = Header(...), limit: int | None = Query(20, ge=1, le=100), exclusive_start_key: str | None = Query(None)):
    """Get gallery items for the current user, ordered by upload time (newest first)"""
    try:
        result = get_gallery_items_from_db(x_user_sub, exclusive_start_key, limit)

        # Convert items to GalleryItem format for response
        gallery_items = []
        for item in result["items"]:
            gallery_items.append({"bucket": item["bucket"], "key": item["key"], "bucketRegion": item["bucketRegion"], "filename": item["filename"], "uploadedAt": item["uploadedAt"], "userId": item["userId"]})

        return {"items": gallery_items, "lastEvaluatedKey": result["lastEvaluatedKey"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve gallery items: {str(e)}") from e
