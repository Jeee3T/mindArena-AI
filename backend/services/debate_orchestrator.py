import os
import asyncio
import logging
import random
from typing import List, Dict, Any
import google.generativeai as genai
from prompts.templates import (
    PERSONA_SYSTEM_PROMPTS,
    CHAT_MESSAGE_TEMPLATE,
    MODERATOR_VERDICT_TEMPLATE,
)
from utils.grounding import get_grounding_context

logger = logging.getLogger(__name__)

_last_configured_key = None

def configure_gemini(api_key: str):
    global _last_configured_key
    if _last_configured_key != api_key:
        # Force REST transport to avoid gRPC deadlocks and socket hang-ups on Windows
        genai.configure(api_key=api_key, transport="rest")
        _last_configured_key = api_key

# Configure Gemini API with REST transport initially
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    configure_gemini(api_key)

def call_gemini_sync(model_name: str, prompt: str, temp: float, max_tokens: int) -> str:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temp,
            max_output_tokens=max_tokens
        )
    )
    if not response or not response.text:
        raise ValueError("Empty response received from Gemini API.")
    return response.text.strip()

async def call_gemini_api(prompt: str, temp: float = 0.7, max_tokens: int = 150) -> str:
    """
    Calls the Gemini API using REST transport in a thread pool to avoid gRPC socket lockups.
    Includes built-in retry and exponential backoff for rate limit (429) errors.
    """
    api_key_check = os.getenv("GEMINI_API_KEY")
    if not api_key_check:
        raise ValueError(
            "GEMINI_API_KEY environment variable is missing. "
            "Please create a backend/.env file containing GEMINI_API_KEY=your_key"
        )
    
    configure_gemini(api_key_check)
    
    max_retries = 5
    base_delay = 1.5
    
    for attempt in range(max_retries):
        try:
            # Run the synchronous generate_content call in a separate thread
            # to prevent event loop blocking and gRPC hang-ups on Windows.
            response_text = await asyncio.to_thread(
                call_gemini_sync,
                "gemini-3.1-flash-lite",
                prompt,
                temp,
                max_tokens
            )
            return response_text
            
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "rate limit" in err_str or "limit exceeded" in err_str:
                if attempt == max_retries - 1:
                    logger.error("Max retries exceeded for Gemini API call due to rate limits.")
                    raise e
                
                # Exponential backoff with jitter
                sleep_time = (base_delay ** attempt) + random.uniform(0.3, 0.7)
                logger.warning(
                    f"Gemini API rate limit hit (429). Retrying in {sleep_time:.2f} seconds... "
                    f"(Attempt {attempt + 1}/{max_retries})"
                )
                await asyncio.sleep(sleep_time)
            else:
                logger.error(f"Gemini API call encountered a critical error: {str(e)}")
                raise e

def _format_chat_history(history: List[Dict[str, str]]) -> str:
    """
    Formats the list of message history dicts into a structured transcript for the prompt context.
    """
    sender_names = {
        "teacher": "Prof. Vasundhara Sen (Teacher)",
        "founder": "Devendra Singhania (Founder)",
        "student": "Ananya Roy (Student)",
        "moderator": "Dr. Shekhar Raghavan (Moderator)"
    }
    
    formatted_messages = []
    for msg in history:
        sender = msg.get("sender", "unknown")
        text = msg.get("text", "").strip()
        display_name = sender_names.get(sender, sender.capitalize())
        formatted_messages.append(f'{display_name}: "{text}"')
        
    if not formatted_messages:
        return "[No messages yet. This is the start of the chat.]"
        
    return "\n".join(formatted_messages)

async def generate_chat_response(topic: str, persona: str, history: List[Dict[str, str]]) -> str:
    """
    Generates a single conversational response for a given persona, aware of the chat history.
    """
    if persona not in ["teacher", "founder", "student"]:
        raise ValueError(f"Invalid persona '{persona}'. Must be teacher, founder, or student.")
        
    grounding = get_grounding_context(topic)
    chat_history_str = _format_chat_history(history)
    
    prompt = CHAT_MESSAGE_TEMPLATE.format(
        persona_system=PERSONA_SYSTEM_PROMPTS[persona],
        topic=topic,
        grounding_context=grounding,
        chat_history=chat_history_str
    )
    
    logger.info(f"Generating chat response for persona: {persona}")
    response = await call_gemini_api(prompt)
    
    # Strip any potential wrapping quotes that the LLM might have returned
    response = response.strip('"').strip("'").strip()
    return response

async def generate_moderator_verdict(topic: str, history: List[Dict[str, str]]) -> str:
    """
    Generates a concise, neutral final verdict summarizing the chat history.
    """
    chat_history_str = _format_chat_history(history)
    
    prompt = MODERATOR_VERDICT_TEMPLATE.format(
        persona_system=PERSONA_SYSTEM_PROMPTS["moderator"],
        topic=topic,
        chat_history=chat_history_str
    )
    
    logger.info("Generating moderator verdict...")
    response = await call_gemini_api(prompt)
    
    # Strip wrapping quotes
    response = response.strip('"').strip("'").strip()
    return response
