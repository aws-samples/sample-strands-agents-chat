import json
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key

from config import RESOURCE_INDEX_NAME, TABLE
from models import MessageWillBeInTable
from utils import base64_to_str, str_to_base64


def get_dynamodb_table():
    return boto3.resource("dynamodb").Table(TABLE)


def find_chat_by_resource_id(resource_id: str) -> dict | None:
    table = get_dynamodb_table()
    items = table.query(
        IndexName=RESOURCE_INDEX_NAME,
        KeyConditionExpression=Key("resourceId").eq(resource_id),
        Limit=1,
    )["Items"]

    if len(items) == 0:
        return None
    else:
        item = items[0]

        if item["dataType"] == "chat":
            return item
        else:
            return None


def is_chat_mine(resource_id: str, x_user_sub: str) -> bool:
    chat = find_chat_by_resource_id(resource_id)

    if chat is None:
        return False

    if chat["userId"] != x_user_sub:
        return False

    return True


def create_chat_in_db(resource_id: str, x_user_sub: str) -> dict:
    item = {
        "queryId": f"{x_user_sub}$chat",
        "orderBy": f"{int(datetime.now().timestamp())}",
        "resourceId": resource_id,
        "userId": x_user_sub,
        "dataType": "chat",
        "title": "",
    }

    table = get_dynamodb_table()
    table.put_item(Item=item)

    return item


def get_chats_from_db(x_user_sub: str, exclusive_start_key: str | None = None, limit: int | None = None) -> dict:
    query_id = f"{x_user_sub}$chat"

    query_params = {
        "KeyConditionExpression": Key("queryId").eq(query_id),
        "ScanIndexForward": False,
    }

    if exclusive_start_key is not None:
        query_params["ExclusiveStartKey"] = json.loads(base64_to_str(exclusive_start_key))

    if limit is not None:
        query_params["Limit"] = limit

    table = get_dynamodb_table()
    res = table.query(**query_params)

    items = res["Items"]
    last_evaluated_key = res["LastEvaluatedKey"] if "LastEvaluatedKey" in res and res["LastEvaluatedKey"] is not None else None

    return {
        "items": items,
        "lastEvaluatedKey": str_to_base64(json.dumps(last_evaluated_key, ensure_ascii=False)) if last_evaluated_key is not None else None,
    }


def create_messages_in_db(resource_id: str, x_user_sub: str, messages: list[MessageWillBeInTable]) -> list[dict]:
    query_id = f"{resource_id}$message"
    sort_key_base = int(datetime.now().timestamp())
    messages_in_table = []

    for idx, m in enumerate(messages):
        messages_in_table.append(
            {
                "queryId": query_id,
                "orderBy": f"{sort_key_base + idx}",
                "resourceId": m.resourceId,
                "dataType": "message",
                "userId": x_user_sub,
                **m.dict(),
            }
        )

    table = get_dynamodb_table()

    with table.batch_writer() as batch:
        for m in messages_in_table:
            batch.put_item(Item=m)

    return messages_in_table


def update_messages_in_db(messages: list[MessageWillBeInTable]) -> list[dict]:
    messages_updated = []

    for m in messages:
        messages_updated.append(m.dict())

    table = get_dynamodb_table()

    with table.batch_writer() as batch:
        for m in messages_updated:
            batch.put_item(Item=m)

    return messages_updated


def get_messages_from_db(resource_id: str) -> list[dict]:
    query_id = f"{resource_id}$message"
    table = get_dynamodb_table()
    items = table.query(
        KeyConditionExpression=Key("queryId").eq(query_id),
    )["Items"]

    return items


def update_chat_title(chat: dict, title: str) -> None:
    table = get_dynamodb_table()
    table.update_item(
        Key={
            "queryId": chat["queryId"],
            "orderBy": chat["orderBy"],
        },
        UpdateExpression="set #title = :title",
        ExpressionAttributeNames={
            "#title": "title",
        },
        ExpressionAttributeValues={
            ":title": title,
        },
    )


def create_gallery_item_in_db(bucket: str, key: str, bucket_region: str, filename: str, x_user_sub: str) -> dict:
    """Create a gallery item in the database"""
    import uuid

    timestamp = int(datetime.now().timestamp())
    resource_id = str(uuid.uuid4())

    item = {
        "queryId": f"{x_user_sub}$gallery",
        "orderBy": f"{timestamp}",
        "resourceId": resource_id,
        "userId": x_user_sub,
        "dataType": "gallery",
        "bucket": bucket,
        "key": key,
        "bucketRegion": bucket_region,
        "filename": filename,
        "uploadedAt": datetime.now().isoformat(),
    }

    table = get_dynamodb_table()
    table.put_item(Item=item)

    return item


def get_gallery_items_from_db(x_user_sub: str, exclusive_start_key: str | None = None, limit: int | None = None) -> dict:
    """Get gallery items for a user, ordered by upload time (newest first)"""
    query_id = f"{x_user_sub}$gallery"

    query_params = {
        "KeyConditionExpression": Key("queryId").eq(query_id),
        "ScanIndexForward": False,  # Newest first
    }

    if exclusive_start_key is not None:
        query_params["ExclusiveStartKey"] = json.loads(base64_to_str(exclusive_start_key))

    if limit is not None:
        query_params["Limit"] = limit

    table = get_dynamodb_table()
    res = table.query(**query_params)

    items = res["Items"]
    last_evaluated_key = res["LastEvaluatedKey"] if "LastEvaluatedKey" in res and res["LastEvaluatedKey"] is not None else None

    return {
        "items": items,
        "lastEvaluatedKey": str_to_base64(json.dumps(last_evaluated_key, ensure_ascii=False)) if last_evaluated_key is not None else None,
    }
