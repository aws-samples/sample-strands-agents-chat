import json
import logging

import boto3
from strands import Agent
from strands.models import BedrockModel

from config import PARAMETER
from database import find_chat_by_resource_id, update_chat_title
from models import MessageNotInTable
from s3 import download_s3_file_on_memory


def build_message(message: MessageNotInTable) -> dict:
    content = []

    for c in message.content:
        if "text" in c:
            content.append(c)
        else:
            binary = download_s3_file_on_memory(c["s3Key"])

            if c["type"] == "image":
                content.append(
                    {
                        "image": {
                            "format": c["extension"],
                            "source": {
                                "bytes": binary,
                            },
                        }
                    }
                )
            elif c["type"] == "video":
                content.append(
                    {
                        "video": {
                            "format": c["extension"],
                            "source": {
                                "bytes": binary,
                            },
                        }
                    }
                )
            else:
                content.append(
                    {
                        "document": {
                            "format": c["extension"],
                            "source": {
                                "bytes": binary,
                            },
                            "name": c["name"],
                        }
                    }
                )

    return {
        "role": message.role,
        "content": content,
    }


def build_messages(messages: list[MessageNotInTable]) -> list[dict]:
    return list(map(build_message, messages))


def generate_chat_title(resource_id: str, messages: list[MessageNotInTable]) -> dict:
    chat = find_chat_by_resource_id(resource_id)

    try:
        messages_json = json.dumps([x.dict() for x in messages], ensure_ascii=False)

        session = boto3.Session(
            region_name=PARAMETER["createTitleModel"]["region"],
        )

        model_params = {
            "model_id": PARAMETER["createTitleModel"]["id"],
            "boto_session": session,
        }

        model = BedrockModel(**model_params)
        agent = Agent(model=model)

        res = agent(f"""You are a writer who generates titles from conversation history. Titles should be concise (within 20 characters) and include important context from the exchange.

Below is the conversation history (JSON):
```
{messages_json}
```

Please generate the title in the same language as the language the user is using.
Output only the title. Never output anything other than the title, such as "Here is the generated title" or "The above is the title."
Do not provide explanations for the output title.
Do not enclose the title in double quotes.
Now please output the title.""")

        title = res.message["content"][0]["text"]
        update_chat_title(chat, title)

        return {
            "title": res.message,
        }

    except Exception as e:
        logging.error(f"Title creation error: {str(e)}", exc_info=True)
        # Set default title when title generation fails
        default_title = "New Chat"

        update_chat_title(chat, default_title)

        # Return same format as successful response
        return {"title": {"content": [{"text": default_title}], "role": "assistant"}}
