import asyncio
import logging
import os

import boto3
from botocore.config import Config
from mcp import StdioServerParameters, stdio_client
from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from strands_tools import calculator, current_time, sleep
from strands_tools.browser import AgentCoreBrowser
from strands_tools.code_interpreter import AgentCoreCodeInterpreter

from config import PARAMETER, WORKSPACE_DIR
from database import create_messages_in_db, get_messages_from_db
from models import MessageInTable, MessageWillBeInTable, StreamingRequest
from services.chat_service import build_message, build_messages
from tools import create_session_aware_upload_tool, web_search, get_weather, get_weather_forecast
from utils import (
    cleanup_session_workspace,
    create_session_workspace,
    generate_session_id,
    generate_session_system_prompt,
    handle_error_and_stream,
    stream_chunk,
)


async def process_streaming_request(request: StreamingRequest, x_user_sub: str, chat_exists: bool):
    """Process streaming request and yield chunks"""

    # Generate session ID and create session workspace
    session_id = generate_session_id()
    session_workspace_dir = create_session_workspace(session_id, WORKSPACE_DIR)
    session_system_prompt = generate_session_system_prompt(session_workspace_dir)

    logging.info(f"Created session workspace: {session_workspace_dir}")

    # Get previous messages if chat exists
    prev_messages = []
    if chat_exists:
        logging.info(f"chat={request.resourceId} found. retrieve prev messages.")
        prev_messages_data = get_messages_from_db(request.resourceId)
        prev_messages = [MessageInTable(**x) for x in prev_messages_data]

    # Initialize text accumulation for assistant response
    accumulated_text = ""

    heartbeat_queue = asyncio.Queue()
    stream_finished = asyncio.Event()

    async def heartbeat_task():
        try:
            while not stream_finished.is_set():
                await asyncio.sleep(5)
                if not stream_finished.is_set():
                    await heartbeat_queue.put(stream_chunk(""))
        except asyncio.CancelledError:
            pass

    async def stream_task():
        nonlocal accumulated_text
        try:
            session = boto3.Session(
                region_name=request.modelRegion,
            )

            model_params = {
                "model_id": request.modelId,
                "boto_session": session,
                "max_tokens": 4096,
                "boto_client_config": Config(
                    retries={
                        "max_attempts": 10,
                        "mode": "standard",
                    },
                    connect_timeout=10,
                    read_timeout=300,
                ),
            }

            # Extract tools from user message
            user_tools = request.userMessage.tools or []

            if "reasoning" in user_tools:
                model_params["additional_request_fields"] = {
                    "thinking": {
                        "type": "enabled",
                        "budget_tokens": 1024,
                    },
                }

            # Create session-aware upload tool
            session_upload_tool = create_session_aware_upload_tool(session_workspace_dir, x_user_sub)

            model = BedrockModel(**model_params)
            tools = [
                current_time,
                calculator,
                sleep,
                session_upload_tool,
                get_weather,
                get_weather_forecast,
            ]

            if "imageGeneration" in user_tools:
                image_generation_mcp_client = MCPClient(
                    lambda: stdio_client(
                        StdioServerParameters(
                            command="python",
                            args=[
                                "-m",
                                "awslabs.nova_canvas_mcp_server.server",
                            ],
                            env={
                                "AWS_REGION": PARAMETER["novaCanvasRegion"],
                                "AWS_ACCESS_KEY_ID": os.environ["AWS_ACCESS_KEY_ID"],
                                "AWS_SECRET_ACCESS_KEY": os.environ["AWS_SECRET_ACCESS_KEY"],
                                "AWS_SESSION_TOKEN": os.environ["AWS_SESSION_TOKEN"],
                            },
                        )
                    )
                )
                image_generation_mcp_client.start()
                image_generation_tools = image_generation_mcp_client.list_tools_sync()
                tools = tools + image_generation_tools

            if "awsDocumentation" in user_tools:
                aws_documentation_mcp_client = MCPClient(
                    lambda: stdio_client(
                        StdioServerParameters(
                            command="python",
                            args=[
                                "-m",
                                "awslabs.aws_documentation_mcp_server.server",
                            ],
                            env={
                                "AWS_DOCUMENTATION_PARTITION": "aws",
                            },
                        )
                    )
                )
                aws_documentation_mcp_client.start()
                aws_documentation_tools = aws_documentation_mcp_client.list_tools_sync()
                tools = tools + aws_documentation_tools

            if "webSearch" in user_tools:
                tools.append(web_search)

            if "weather" in user_tools:
                tools.extend([get_weather, get_weather_forecast])

            if "codeInterpreter" in user_tools:
                agent_core_code_interpreter = AgentCoreCodeInterpreter(region=PARAMETER["agentCoreRegion"])
                tools.append(agent_core_code_interpreter.code_interpreter)

            if "webBrowser" in user_tools:
                agent_core_browser = AgentCoreBrowser(region=PARAMETER["agentCoreRegion"])
                tools.append(agent_core_browser.browser)

            agent = Agent(
                system_prompt=session_system_prompt,
                model=model,
                tools=tools,
                messages=build_messages(prev_messages),
            )

            reasoning_block = False

            async for event in agent.stream_async(build_message(request.userMessage)["content"]):
                # Text output
                if "event" in event and "contentBlockDelta" in event["event"] and "delta" in event["event"]["contentBlockDelta"] and "text" in event["event"]["contentBlockDelta"]["delta"]:
                    text_chunk = event["event"]["contentBlockDelta"]["delta"]["text"]
                    accumulated_text += text_chunk
                    await heartbeat_queue.put(stream_chunk(text_chunk))

                # Reasoning text
                if "event" in event and "contentBlockDelta" in event["event"] and "delta" in event["event"]["contentBlockDelta"] and "reasoningContent" in event["event"]["contentBlockDelta"]["delta"] and "text" in event["event"]["contentBlockDelta"]["delta"]["reasoningContent"]:
                    if not reasoning_block:
                        reasoning_start = "\n```Thinking\n"
                        accumulated_text += reasoning_start
                        await heartbeat_queue.put(stream_chunk(reasoning_start))
                    reasoning_text = event["event"]["contentBlockDelta"]["delta"]["reasoningContent"]["text"]
                    accumulated_text += reasoning_text
                    await heartbeat_queue.put(stream_chunk(reasoning_text))
                    reasoning_block = True

                # Reasoning stop
                if "event" in event and "contentBlockStop" in event["event"] and reasoning_block:
                    reasoning_end = "\n```\n"
                    accumulated_text += reasoning_end
                    await heartbeat_queue.put(stream_chunk(reasoning_end))
                    reasoning_block = False

                # Start using tool
                elif "event" in event and "contentBlockStart" in event["event"] and "start" in event["event"]["contentBlockStart"] and "toolUse" in event["event"]["contentBlockStart"]["start"] and "name" in event["event"]["contentBlockStart"]["start"]["toolUse"]:
                    tool_start = f"\n```{event['event']['contentBlockStart']['start']['toolUse']['name']}\n"
                    accumulated_text += tool_start
                    await heartbeat_queue.put(stream_chunk(tool_start))

                # During tool use
                elif "event" in event and "contentBlockDelta" in event["event"] and "delta" in event["event"]["contentBlockDelta"] and "toolUse" in event["event"]["contentBlockDelta"]["delta"] and "input" in event["event"]["contentBlockDelta"]["delta"]["toolUse"]:
                    tool_input = event["event"]["contentBlockDelta"]["delta"]["toolUse"]["input"]
                    accumulated_text += tool_input
                    await heartbeat_queue.put(stream_chunk(tool_input))

                # Stop using tool
                elif "event" in event and "messageStop" in event["event"] and "stopReason" in event["event"]["messageStop"] and event["event"]["messageStop"]["stopReason"] == "tool_use":
                    tool_end = "\n```\n"
                    accumulated_text += tool_end
                    await heartbeat_queue.put(stream_chunk(tool_end))
        except Exception as e:
            logging.error(f"Streaming error: {str(e)}", exc_info=True)
            await heartbeat_queue.put(handle_error_and_stream(e))
        finally:
            stream_finished.set()

    heartbeat_task_handle = asyncio.create_task(heartbeat_task())
    stream_task_handle = asyncio.create_task(stream_task())

    try:
        while not stream_finished.is_set() or not heartbeat_queue.empty():
            try:
                chunk = await asyncio.wait_for(heartbeat_queue.get(), timeout=1.0)
                yield chunk
            except TimeoutError:
                continue
    finally:
        heartbeat_task_handle.cancel()
        stream_task_handle.cancel()
        try:
            await heartbeat_task_handle
        except asyncio.CancelledError:
            pass
        try:
            await stream_task_handle
        except asyncio.CancelledError:
            pass

        # Save messages to database after streaming completes
        try:
            # Use tools directly from user message
            user_message = request.userMessage

            # Build assistant message from accumulated text (assistant messages have tools=None)
            assistant_message = MessageWillBeInTable(role="assistant", content=[{"text": accumulated_text}] if accumulated_text else [{"text": ""}], resourceId=request.assistantMessage.resourceId, tools=None)

            # Save both messages to database
            messages_to_save = [user_message, assistant_message]
            create_messages_in_db(request.resourceId, x_user_sub, messages_to_save)
            logging.info(f"Successfully saved {len(messages_to_save)} messages for chat {request.resourceId}")

        except Exception as e:
            # Log error but don't interrupt streaming response
            logging.error(f"Failed to save messages for chat {request.resourceId}: {str(e)}", exc_info=True)

        # Clean up session workspace
        try:
            cleanup_session_workspace(session_id, WORKSPACE_DIR)
            logging.info(f"Cleaned up session workspace: {session_workspace_dir}")
        except Exception as e:
            logging.error(f"Failed to clean up session workspace {session_workspace_dir}: {str(e)}")
