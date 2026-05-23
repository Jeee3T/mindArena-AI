import os
import sys
from dotenv import load_dotenv

# Load environment variables at the very beginning, resolving absolute path to .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, ".env"))

# Robust env key normalization: handles trailing/leading spaces or quotes from .env
for k, v in list(os.environ.items()):
    if k.strip() == "GEMINI_API_KEY":
        clean_val = v.strip().strip('"').strip("'").strip()
        os.environ["GEMINI_API_KEY"] = clean_val

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict

# Add backend directory to path to ensure modules are found
sys.path.append(backend_dir)

from services.debate_orchestrator import generate_chat_response, generate_moderator_verdict

# Print API key status to console on startup
loaded_key = os.getenv("GEMINI_API_KEY")
if loaded_key:
    print(f"✅ GEMINI_API_KEY successfully loaded. Starts with: {loaded_key[:6]}...")
else:
    print("❌ GEMINI_API_KEY NOT found in environment. Please check backend/.env file.")

app = FastAPI(
    title="mindArena API",
    description="Backend API for real-time AI group-chat debate simulation using Gemini API",
    version="2.0.0"
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    sender: str = Field(..., description="Sender key (teacher, founder, student, moderator)")
    text: str = Field(..., description="Content of the chat message")

class ChatMessageRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=200, description="The topic for debate")
    persona: str = Field(..., description="The persona who is replying (teacher, founder, student)")
    history: List[ChatMessage] = Field(default=[], description="The list of chat messages so far")

class ChatVerdictRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=200, description="The topic for debate")
    history: List[ChatMessage] = Field(..., description="The list of chat messages so far")

@app.get("/")
def read_root():
    return {"status": "online", "service": "AI Chat Debate Simulator API"}

@app.post("/chat/message")
async def create_chat_message(request: ChatMessageRequest):
    topic = request.topic.strip()
    persona = request.persona.strip().lower()
    
    # Extract dict values from BaseModel history list
    history_list = [{"sender": msg.sender, "text": msg.text} for msg in request.history]
    
    try:
        response_text = await generate_chat_response(topic, persona, history_list)
        return {"text": response_text}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while generating the message: {str(e)}"
        )

@app.post("/chat/verdict")
async def create_chat_verdict(request: ChatVerdictRequest):
    topic = request.topic.strip()
    
    history_list = [{"sender": msg.sender, "text": msg.text} for msg in request.history]
    
    if not history_list:
        raise HTTPException(status_code=400, detail="Cannot generate moderator verdict on an empty chat history.")
        
    try:
        verdict_text = await generate_moderator_verdict(topic, history_list)
        return {"text": verdict_text}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while generating the moderator verdict: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
