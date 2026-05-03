from duckduckgo_search import DDGS
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import AsyncGroq
from typing import Optional
import os, json, asyncio, re
import urllib.parse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://mytutor-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
conversation_histories = {}

def needs_web_search(message: str) -> bool:
    keywords = [
        "latest", "recent", "today", "2026", "2025", "now", "current",
        "news", "update", "new", "just", "recently", "this week",
        "this month", "what happened", "who won", "price of", "stock",
        "weather", "live", "trending", "released", "launched"
    ]
    return any(kw in message.lower() for kw in keywords)

def web_search(query: str) -> str:
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
        if not results:
            return ""
        ctx = "🌐 WEB SEARCH RESULTS (use these for accurate latest info):\n\n"
        for i, r in enumerate(results, 1):
            ctx += f"{i}. **{r.get('title', '')}**\n"
            ctx += f"   {r.get('body', '')}\n"
            ctx += f"   Source: {r.get('href', '')}\n\n"
        return ctx
    except:
        return ""

def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None

MODES = {
    "tutor": """You are TutorAI, a world-class AI tutor. Your knowledge is current as of May 2026.

ROLE BOUNDARIES — This is critical:
- If user asks to write/debug code → respond: "That's a coding task! 💻 Switch to **CodeAI** mode (left sidebar) for expert programming help."
- If user asks for deep analysis/philosophy → suggest ThinkAI
- If user asks to write creatively/brainstorm → suggest CreativeAI
- Stay strictly in tutoring/teaching/explaining role

RESPONSE STYLE:
- Match ChatGPT's response style: clear, structured, not too long, not too short
- Use bullet points, bold headers, examples where helpful
- Be warm, encouraging, and patient
- Always give real examples
- End with a follow-up question when appropriate""",

    "code": """You are CodeAI, an expert senior programmer with knowledge up to May 2026. 

ROLE BOUNDARIES:
- If user asks a general knowledge/tutoring question → suggest TutorAI
- If user asks for creative writing → suggest CreativeAI
- Stay strictly in coding/debugging/technical role

RESPONSE STYLE:
- Always use proper code blocks with language specified
- Explain WHY the code works, not just what it does
- Point out potential bugs or improvements
- Be concise but complete — like a senior dev doing code review
- For bugs: show broken code, then fixed code, then explain""",

    "think": """You are ThinkAI, a deep analytical reasoner with knowledge up to May 2026.

ROLE BOUNDARIES:
- If user asks to write code → suggest CodeAI
- If user wants simple explanation → suggest TutorAI
- Stay in deep analysis, philosophy, strategy, reasoning role

RESPONSE STYLE:
- Think step-by-step, show your reasoning process
- Explore multiple perspectives before concluding
- Be honest about uncertainty
- Use structured analysis: Problem → Analysis → Perspectives → Conclusion
- Match the depth of a PhD-level discussion""",

    "creative": """You are CreativeAI, an imaginative creative partner with knowledge up to May 2026.

ROLE BOUNDARIES:
- If user asks to debug/write technical code → suggest CodeAI
- If user wants factual explanation → suggest TutorAI
- Stay in creative writing, brainstorming, ideation role

RESPONSE STYLE:
- Generate unique, original ideas with personality
- Always offer 2-3 variations or options
- Write with flair, style, and creativity
- Build on user's ideas and make them better
- Be enthusiastic and inspiring""",

    "youtube": """You are a YouTube Video Analyst. Analyze and summarize video content.

RESPONSE STYLE:
- Provide clear structured summary with sections
- Key points in bullet form
- Main takeaways
- Any action items or recommendations
- Keep it concise but comprehensive""",
}

class Message(BaseModel):
    message: str
    mode: str = "tutor"
    pdf_context: str = ""
    image_data: Optional[str] = None
    language: str = "English"
    youtube_url: Optional[str] = None

class YouTubeRequest(BaseModel):
    url: str
    language: str = "English"

@app.get("/")
def home():
    return {"status": "TutorAI backend is live! v3.0"}

@app.post("/chat")
async def chat(data: Message, session_id: str = Header(default="default")):
    system = MODES.get(data.mode, MODES["tutor"])

    # Language support
    if data.language and data.language != "English":
        system += f"\n\nIMPORTANT: Respond in {data.language} language."

    if data.pdf_context:
        system = f"You have access to this document:\n---\n{data.pdf_context}\n---\n\n" + system

    # Web search for latest info
    if needs_web_search(data.message):
        search_context = web_search(data.message)
        if search_context:
            system += f"\n\n{search_context}\nToday's date is May 2026."

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
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        if data.image_data:
            history.append({"role": "user", "content": data.message or "[User shared an image]"})
        history.append({"role": "assistant", "content": full_reply})
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/youtube")
async def summarize_youtube(data: YouTubeRequest, session_id: str = Header(default="default")):
    video_id = extract_youtube_id(data.url)
    if not video_id:
        return {"error": "Invalid YouTube URL"}

    # Search for video info via DuckDuckGo
    search_results = web_search(f"youtube video {video_id} summary transcript content")
    
    system = MODES["youtube"]
    if data.language != "English":
        system += f"\n\nRespond in {data.language}."

    prompt = f"""Analyze this YouTube video: {data.url}

Video ID: {video_id}

{search_results}

Please provide:
1. **Video Summary** — What this video is about
2. **Key Points** — Main things covered
3. **Key Takeaways** — What the viewer should remember
4. **Who Should Watch** — Target audience

Note: If you cannot find specific info about this video, provide a general analysis based on available context."""

    async def generate():
        full_reply = ""
        try:
            stream = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=1024,
                temperature=0.7,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_reply += delta
                    yield f"data: {json.dumps({'chunk': delta})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/reset")
async def reset(session_id: str = Header(default="default")):
    conversation_histories.pop(session_id, None)
    return {"status": "reset"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)