import logging
from typing import Annotated

from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse

from database import find_chat_by_resource_id
from models import CreateChat, CreateTitle, StreamingRequest
from routers.chat import create_chat, create_title
from services.streaming_service import process_streaming_request

router = APIRouter(prefix="/api", tags=["streaming"])


@router.post("/streaming")
async def streaming(request: StreamingRequest, x_user_sub: Annotated[str | None, Header()] = None):
    chat = find_chat_by_resource_id(request.resourceId)
    chat_exists = chat is not None

    if not chat_exists:
        logging.info(f"chat={request.resourceId} not found. create new one.")
        create_chat(CreateChat(resourceId=request.resourceId), x_user_sub)
        create_title(CreateTitle(messages=[request.userMessage]), request.resourceId, x_user_sub)

    async def generate():
        async for chunk in process_streaming_request(request, x_user_sub, chat_exists):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )
