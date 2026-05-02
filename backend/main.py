from duckduckgo_search import DDGS
import re

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import AsyncGroq
from typing import Optional
import os
import json
import asyncio  # ⭐ ADD THIS

app = FastAPI()

def needs_web_search(message: str) -> bool:
    """Check if message needs current/latest info"""
    keywords = [
        "latest", "recent", "today", "2026", "2025", "now", "current",
        "news", "update", "new", "just", "recently", "this week",
        "this month", "what happened", "who won", "price of", "stock"
    ]
    message_lower = message.lower()
    return any(kw in message_lower for kw in keywords)

def web_search(query: str) -> str:
    """Search web and return formatted results"""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=4))
        if not results:
            return ""
        
        search_context = "CURRENT WEB SEARCH RESULTS (use this for latest info):\n\n"
        for i, r in enumerate(results, 1):
            search_context += f"{i}. {r.get('title', '')}\n"
            search_context += f"   {r.get('body', '')}\n"
            search_context += f"   Source: {r.get('href', '')}\n\n"
        return search_context
    except Exception as e:
        return ""

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Local frontend
        "https://mytutor-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
conversation_histories = {}

MODES = {
    "tutor": """You are TutorAI, a world-class AI tutor.
- Explain things simply with real examples
- Ask follow-up questions to check understanding
- Be warm, encouraging, patient
- Format with clear structure""",
    "code": """You are CodeAI, an expert programmer.
- Write clean, well-commented code
- Explain WHY code works, not just what it does
- Always use proper code blocks with language specified
- Spot and fix bugs clearly""",
    "think": """You are ThinkAI, a deep analytical reasoner.
- Think step by step through complex problems
- Show your reasoning process
- Be honest about uncertainty
- Explore multiple perspectives""",
    "creative": """You are CreativeAI, an imaginative creative partner.
- Generate unique, original ideas
- Build on the user's ideas and make them better
- Write with style, flair, and personality
- Always give multiple options/variations""",
}

class Message(BaseModel):
    message: str
    mode: str = "tutor"
    pdf_context: str = ""
    image_data: Optional[str] = None

@app.get("/")
def home():
    return {"status": "TutorAI backend is live!"}

@app.post("/chat")
async def chat(data: Message, session_id: str = Header(default="default")):
    system = MODES.get(data.mode, MODES["tutor"])
    
    if data.pdf_context:
        system = f"You have access to this document:\n---\n{data.pdf_context}\n---\n" + system

    if needs_web_search(data.message):
        search_context = web_search(data.message)
        if search_context:
            system = system + f"\n\n{search_context}\nToday's date is May 2026. Use the search results above to answer accurately."

    history = conversation_histories.setdefault(session_id, [])

    if data.image_data:
        try:
            header, base64_str = data.image_data.split(",", 1)
            media_type = header.split(":")[1].split(";")[0]
        except Exception:
            media_type = "image/jpeg"
            base64_str = data.image_data

        text_only_history = [m for m in history if isinstance(m.get("content"), str)]
                
        messages_to_send = (
            [{"role": "system", "content": system}]
            + text_only_history
            + [{"role": "user", "content": [
                {"type": "text", "text": data.message or "Describe and analyze this image in detail."},
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{base64_str}"}}
            ]}]
        )
        model = "meta-llama/llama-4-scout-17b-16e-instruct"
    else:
        history.append({"role": "user", "content": data.message})
        messages_to_send = [{"role": "system", "content": system}] + history
        model = "llama-3.3-70b-versatile"

    async def generate():
        full_reply = ""
        try:
            stream = await client.chat.completions.create(
                model=model,
                messages=messages_to_send,
                max_completion_tokens=1024,
                temperature=0.7,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_reply += delta
                    yield f"data: {json.dumps({'chunk': delta})}\n\n"
                    # ⭐ KEY: Add delay for realistic typing effect
                    await asyncio.sleep(0.03)  # 30ms per chunk
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        if data.image_data:
            history.append({"role": "user", "content": data.message or "[User shared an image]"})
        history.append({"role": "assistant", "content": full_reply})
        
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/reset")
async def reset(session_id: str = Header(default="default")):
    conversation_histories.pop(session_id, None)
    return {"status": "reset"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)