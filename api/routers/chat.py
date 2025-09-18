from typing import Annotated

from fastapi import APIRouter, Header, Response, status

from database import (
    create_chat_in_db,
    create_messages_in_db,
    find_chat_by_resource_id,
    get_chats_from_db,
    get_messages_from_db,
    is_chat_mine,
    update_messages_in_db,
)
from models import CreateChat, CreateMessages, CreateTitle, ToolSelectionRequest, ToolSelectionResponse, UpdateMessages
from services.chat_service import generate_chat_title
from services.tool_selection_service import select_tools_for_prompt

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
def create_chat(request: CreateChat, x_user_sub: Annotated[str | None, Header()] = None):
    item = create_chat_in_db(request.resourceId, x_user_sub)
    return item


@router.get("")
def get_chats(
    x_user_sub: Annotated[str | None, Header()] = None,
    exclusive_start_key: str | None = None,
    limit: int | None = None,
):
    result = get_chats_from_db(x_user_sub, exclusive_start_key, limit)
    return result


@router.get("/{resource_id}")
def get_chat(resource_id: str, x_user_sub: Annotated[str | None, Header()] = None):
    chat = find_chat_by_resource_id(resource_id)

    if chat is None:
        return Response(status_code=status.HTTP_404_NOT_FOUND)

    if chat["userId"] != x_user_sub:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    return chat


@router.post("/{resource_id}/messages")
def create_messages(
    request: CreateMessages,
    resource_id: str,
    x_user_sub: Annotated[str | None, Header()] = None,
):
    if not is_chat_mine(resource_id, x_user_sub):
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    messages_in_table = create_messages_in_db(resource_id, x_user_sub, request.messages)
    return messages_in_table


@router.put("/{resource_id}/messages")
def update_messages(
    request: UpdateMessages,
    resource_id: str,
    x_user_sub: Annotated[str | None, Header()] = None,
):
    if not is_chat_mine(resource_id, x_user_sub):
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    messages_updated = update_messages_in_db(request.messages)
    return messages_updated


@router.get("/{resource_id}/messages")
def get_messages(resource_id: str, x_user_sub: Annotated[str | None, Header()] = None):
    if not is_chat_mine(resource_id, x_user_sub):
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    items = get_messages_from_db(resource_id)
    return items


@router.post("/{resource_id}/title")
def create_title(
    request: CreateTitle,
    resource_id: str,
    x_user_sub: Annotated[str | None, Header()] = None,
):
    if not is_chat_mine(resource_id, x_user_sub):
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    result = generate_chat_title(resource_id, request.messages)
    return result


@router.post("/select-tools")
def select_tools(
    request: ToolSelectionRequest,
    x_user_sub: Annotated[str | None, Header()] = None,
) -> ToolSelectionResponse:
    """
    Analyze user prompt and automatically select appropriate tools
    """
    tool_selection = select_tools_for_prompt(request.prompt)
    return ToolSelectionResponse(**tool_selection)
