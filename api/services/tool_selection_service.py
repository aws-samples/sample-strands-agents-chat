import json
import logging

import boto3
from strands import Agent
from strands.models import BedrockModel

from config import PARAMETER


def select_tools_for_prompt(prompt: str) -> dict:
    """
    Use LLM to analyze the user's prompt and determine which tools should be enabled.

    Args:
        prompt: The user's input prompt to analyze

    Returns:
        Dictionary with tool selection results
    """
    try:
        session = boto3.Session(
            region_name=PARAMETER["createTitleModel"]["region"],
        )

        model_params = {
            "model_id": PARAMETER["createTitleModel"]["id"],
            "boto_session": session,
        }

        model = BedrockModel(**model_params)
        agent = Agent(model=model)

        tool_descriptions = {
            "reasoning": "Enable step-by-step reasoning for complex problems, logical analysis, math problems, or multi-step tasks",
            "imageGeneration": "Generate, create, or produce images, illustrations, diagrams, or visual content",
            "webSearch": "Search for current information, latest news, recent events, or real-time data from the internet",
            "awsDocumentation": "Access AWS documentation, services, configurations, or cloud-related questions",
            "codeInterpreter": "Execute code, analyze data, perform calculations, or work with programming tasks",
            "webBrowser": "Browse specific websites, read web pages, or access specific URLs",
        }

        analysis_prompt = f"""You are a tool selection assistant. Analyze the user's prompt and determine which tools are needed.

Available tools and when to use them:
- reasoning: {tool_descriptions["reasoning"]}
- imageGeneration: {tool_descriptions["imageGeneration"]}
- webSearch: {tool_descriptions["webSearch"]}
- awsDocumentation: {tool_descriptions["awsDocumentation"]}
- codeInterpreter: {tool_descriptions["codeInterpreter"]}
- webBrowser: {tool_descriptions["webBrowser"]}

User prompt: "{prompt}"

Analyze the prompt and determine which tools are needed. Respond with ONLY a valid JSON object with boolean values for each tool:

{{
  "reasoning": boolean,
  "imageGeneration": boolean,
  "webSearch": boolean,
  "awsDocumentation": boolean,
  "codeInterpreter": boolean,
  "webBrowser": boolean
}}

Guidelines:
- Only enable tools that are clearly needed for the specific request
- Don't enable reasoning for simple questions
- Only enable webSearch if current/recent information is needed
- Only enable imageGeneration if images need to be created/generated
- Only enable awsDocumentation for AWS-specific questions
- Only enable codeInterpreter for programming/calculation tasks
- Only enable webBrowser for browsing specific websites

Output only the JSON, no explanation."""

        res = agent(analysis_prompt)
        response_text = res.message["content"][0]["text"].strip()

        # Try to parse the JSON response
        try:
            tool_selection = json.loads(response_text)

            # Validate that all expected keys are present
            expected_keys = ["reasoning", "imageGeneration", "webSearch", "awsDocumentation", "codeInterpreter", "webBrowser"]
            for key in expected_keys:
                if key not in tool_selection:
                    tool_selection[key] = False
                # Ensure boolean values
                tool_selection[key] = bool(tool_selection[key])

            return tool_selection

        except json.JSONDecodeError:
            logging.error(f"Failed to parse tool selection response: {response_text}")
            # Return conservative defaults
            return {"reasoning": False, "imageGeneration": False, "webSearch": False, "awsDocumentation": False, "codeInterpreter": False, "webBrowser": False}

    except Exception as e:
        logging.error(f"Tool selection error: {str(e)}", exc_info=True)
        # Return conservative defaults on error
        return {"reasoning": False, "imageGeneration": False, "webSearch": False, "awsDocumentation": False, "codeInterpreter": False, "webBrowser": False}
