import asyncio
import logging
import os

import boto3
from botocore.config import Config
from mcp import StdioServerParameters, stdio_client
from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from strands_tools import calculator, current_time
from strands_tools.browser import AgentCoreBrowser
from strands_tools.code_interpreter import AgentCoreCodeInterpreter

from config import PARAMETER, WORKSPACE_DIR
from database import get_messages_from_db
from models import MessageInTable, StreamingRequest
from services.chat_service import build_message, build_messages
from tools import create_session_aware_upload_tool, web_search
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
        try:
            session = boto3.Session(
                region_name=request.modelRegion,
            )

            model_params = {
                "model_id": request.modelId,
                "boto_session": session,
                "boto_client_config": Config(
                    retries={
                        "max_attempts": 10,
                        "mode": "standard",
                    },
                    connect_timeout=10,
                    read_timeout=300,
                ),
            }

            if request.reasoning:
                model_params["additional_request_fields"] = {
                    "thinking": {
                        "type": "enabled",
                        "budget_tokens": 4096,
                    },
                }

            # Create session-aware upload tool
            session_upload_tool = create_session_aware_upload_tool(session_workspace_dir)

            model = BedrockModel(**model_params)
            tools = [
                current_time,
                calculator,
                session_upload_tool,
            ]

            if request.imageGeneration:
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

            if request.awsDocumentation:
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

            if request.webSearch:
                tools.append(web_search)

            if request.codeInterpreter:
                agent_core_code_interpreter = AgentCoreCodeInterpreter(region=PARAMETER["agentCoreRegion"])
                tools.append(agent_core_code_interpreter.code_interpreter)

            if request.webBrowser:
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
                    await heartbeat_queue.put(stream_chunk(event["event"]["contentBlockDelta"]["delta"]["text"]))

                # Reasoning text
                if "event" in event and "contentBlockDelta" in event["event"] and "delta" in event["event"]["contentBlockDelta"] and "reasoningContent" in event["event"]["contentBlockDelta"]["delta"] and "text" in event["event"]["contentBlockDelta"]["delta"]["reasoningContent"]:
                    if not reasoning_block:
                        await heartbeat_queue.put(stream_chunk("\n```Thinking\n"))
                    await heartbeat_queue.put(stream_chunk(event["event"]["contentBlockDelta"]["delta"]["reasoningContent"]["text"]))
                    reasoning_block = True

                # Reasoning stop
                if "event" in event and "contentBlockStop" in event["event"] and reasoning_block:
                    await heartbeat_queue.put(stream_chunk("\n```\n"))
                    reasoning_block = False

                # Start using tool
                elif "event" in event and "contentBlockStart" in event["event"] and "start" in event["event"]["contentBlockStart"] and "toolUse" in event["event"]["contentBlockStart"]["start"] and "name" in event["event"]["contentBlockStart"]["start"]["toolUse"]:
                    await heartbeat_queue.put(stream_chunk(f"\n```{event['event']['contentBlockStart']['start']['toolUse']['name']}\n"))

                # During tool use
                elif "event" in event and "contentBlockDelta" in event["event"] and "delta" in event["event"]["contentBlockDelta"] and "toolUse" in event["event"]["contentBlockDelta"]["delta"] and "input" in event["event"]["contentBlockDelta"]["delta"]["toolUse"]:
                    await heartbeat_queue.put(stream_chunk(event["event"]["contentBlockDelta"]["delta"]["toolUse"]["input"]))

                # Stop using tool
                elif "event" in event and "messageStop" in event["event"] and "stopReason" in event["event"]["messageStop"] and event["event"]["messageStop"]["stopReason"] == "tool_use":
                    await heartbeat_queue.put(stream_chunk("\n```\n"))
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

        # Clean up session workspace
        try:
            cleanup_session_workspace(session_id, WORKSPACE_DIR)
            logging.info(f"Cleaned up session workspace: {session_workspace_dir}")
        except Exception as e:
            logging.error(f"Failed to clean up session workspace {session_workspace_dir}: {str(e)}")
