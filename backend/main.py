from duckduckgo_search import DDGS
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import AsyncGroq
from typing import Optional
import os, json, re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://vyse-chatbot.vercel.app",
        "https://mytutor-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
conversation_histories = {}


# ─── WEB SEARCH ────────────────────────────────────────────────────────────────
def web_search(query: str, max_results: int = 6) -> str:
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return ""
        ctx = "🌐 LIVE WEB RESULTS (May 2026 — use these for accurate answers):\n\n"
        for i, r in enumerate(results, 1):
            ctx += f"{i}. {r.get('title', '')}\n"
            ctx += f"   {r.get('body', '')}\n"
            ctx += f"   Source: {r.get('href', '')}\n\n"
        return ctx
    except Exception:
        return ""


def should_force_search(message: str) -> bool:
    """Force web search for queries that need real-time data"""
    patterns = [
        r'\b(pkr|usd|eur|gbp|aed|sar|inr|dirham|dollar|pound|euro|rupee|riyal)\b',
        r'\b(price|rate|exchange|convert|stock|crypto|bitcoin|gold|silver)\b',
        r'\b(today|current|latest|now|right now|live|real.?time|2026)\b',
        r'\b(news|update|recent|just|happen|weather)\b',
        r'\b\d+\s*(usd|pkr|aed|eur|gbp|inr|sar)\b',
        r'\b(to|in)\s*(pkr|usd|aed|eur|gbp|inr|sar)\b',
    ]
    msg_lower = message.lower()
    return any(re.search(p, msg_lower, re.IGNORECASE) for p in patterns)


# ─── YOUTUBE ───────────────────────────────────────────────────────────────────
def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def get_youtube_oembed(video_id: str) -> dict:
    """Fetch real video title/author from YouTube oEmbed — no API key needed."""
    try:
        import urllib.request
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            return {"title": data.get("title", ""), "author": data.get("author_name", ""), "found": True}
    except Exception:
        return {"title": "", "author": "", "found": False}


def get_youtube_context(video_id: str, url: str) -> str:
    meta = get_youtube_oembed(video_id)
    ctx = f"🎬 YOUTUBE VIDEO INFO:\nURL: {url}\nVideo ID: {video_id}\n"
    if meta["found"]:
        ctx += f"Title: {meta['title']}\nChannel: {meta['author']}\n\n"
        ctx += web_search(f"{meta['title']} {meta['author']} youtube", max_results=4)
    else:
        ctx += "Title: Could not retrieve (video may be private or unavailable)\n\n"
        ctx += web_search(f"youtube watch?v={video_id}", max_results=4)
    return ctx


# ─── LANGUAGE ──────────────────────────────────────────────────────────────────
def apply_language(system: str, language: str) -> str:
    if language and language != "English":
        system += (
            f"\n\n🌐 LANGUAGE RULE — CRITICAL: You MUST respond ENTIRELY in {language}. "
            f"Every single word must be in {language}. Do NOT use English at all."
        )
    return system


# ─── MODES ─────────────────────────────────────────────────────────────────────
RESPONSE_LENGTH_RULE = """
🎯 RESPONSE LENGTH — CRITICAL:
- Simple/factual question (greetings, conversions, definitions, yes/no, capital cities, boiling points) → 1-3 sentences MAX. No headers. No bullets.
- Medium question (how-to, explain concept) → 1-3 short paragraphs or brief bullets.
- Complex/broad topic (deep analysis, architecture, essays) → full structured response.
- NEVER pad. If 2 sentences answer it, use 2 sentences. Match depth to the question.
- Currency/rate/price queries: state the value and source in 1-2 lines. Done.
"""

MODES = {
    "tutor": f"""You are TutorAI — a world-class AI tutor. Today is May 2026.

ROLE: Teach, explain, clarify any topic clearly and engagingly.
- Code questions → suggest CodeAI mode.
- Pure creative tasks → suggest CreativeAI.

{RESPONSE_LENGTH_RULE}

STYLE: warm, encouraging, use real examples, end complex answers with a follow-up question.""",

    "code": f"""You are CodeAI — an expert senior programmer. Today is May 2026.

ROLE: Code, debug, explain technical concepts. Always use proper code blocks with language tag.
- General knowledge → suggest TutorAI.

{RESPONSE_LENGTH_RULE}

STYLE: precise, show WHY code works, for bugs show broken → fixed → explain.""",

    "think": f"""You are ThinkAI — a deep analytical reasoner. Today is May 2026.

ROLE: Deep analysis, philosophy, strategy, reasoning, debate.
- Simple facts → still answer concisely even in think mode.
- Code → suggest CodeAI.

{RESPONSE_LENGTH_RULE}

STYLE: step-by-step reasoning, multiple perspectives, honest about uncertainty.""",

    "creative": f"""You are CreativeAI — an imaginative creative partner. Today is May 2026.

ROLE: Creative writing, brainstorming, ideation, storytelling.
- Technical code → suggest CodeAI.

{RESPONSE_LENGTH_RULE}

STYLE: original, enthusiastic, offer 2-3 variations for open-ended tasks.""",

    "youtube": """You are YouTubeAI — a YouTube video analyst. Today is May 2026.

ROLE: Analyze and summarize the EXACT YouTube video the user provides.

RESPONSE FORMAT:
## 🎬 [Actual Video Title]
**Channel:** [Channel Name]

### Summary
[What this video is actually about — 2-3 sentences]

### Key Points
- [Main point 1]
- [Main point 2]
- [Main point 3]

### Takeaways
[What viewers should remember]

### Who Should Watch
[Target audience]

CRITICAL: Only analyze the exact video provided. If info is unavailable, say so honestly.""",
}


# ─── MODELS ────────────────────────────────────────────────────────────────────
class Message(BaseModel):
    message: str
    mode: str = "tutor"
    pdf_context: str = ""
    image_data: Optional[str] = None
    language: str = "English"

class YouTubeRequest(BaseModel):
    url: str
    language: str = "English"


# ─── ROUTES ────────────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {"status": "Vyse backend v6.0 — live 🚀"}


@app.post("/chat")
async def chat(data: Message, session_id: str = Header(default="default")):
    base_system = MODES.get(data.mode, MODES["tutor"])
    system = apply_language(base_system, data.language)

    if data.pdf_context:
        system = f"You have access to this document:\n---\n{data.pdf_context[:8000]}\n---\n\n" + system

    # Always run web search — force it for financial/current queries
    search_context = web_search(data.message)
    if search_context:
        priority = "⚠️ PRIORITY: Use these web results for any factual/current data. Today is May 2026." if should_force_search(data.message) else ""
        system += f"\n\n{search_context}\n{priority}"

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
            + text_only_history[-10:]
            + [{"role": "user", "content": [
                {"type": "text", "text": data.message or "Describe and analyze this image in detail."},
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{base64_str}"}}
            ]}]
        )
        model = "meta-llama/llama-4-scout-17b-16e-instruct"
    else:
        history.append({"role": "user", "content": data.message})
        messages_to_send = [{"role": "system", "content": system}] + history[-20:]
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
            history.append({"role": "user", "content": data.message or "[image]"})
        history.append({"role": "assistant", "content": full_reply})
        # Keep history bounded to last 40 messages
        if len(history) > 40:
            conversation_histories[session_id] = history[-40:]

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/youtube")
async def summarize_youtube(data: YouTubeRequest, session_id: str = Header(default="default")):
    video_id = extract_youtube_id(data.url)
    if not video_id:
        async def error_gen():
            yield f"data: {json.dumps({'chunk': '❌ Invalid YouTube URL. Please paste a valid link like: https://youtu.be/VIDEO_ID or https://youtube.com/watch?v=VIDEO_ID'})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        return StreamingResponse(error_gen(), media_type="text/event-stream")

    video_context = get_youtube_context(video_id, data.url)
    system = apply_language(MODES["youtube"], data.language)

    prompt = f"""Analyze this YouTube video for the user.

{video_context}

Provide a detailed analysis of this specific video (ID: {video_id}).
Use the title and channel if retrieved. Use web results if they contain info about this video.
If you genuinely cannot find information, say: "I could not find detailed information about this specific video. It may be very new, private, or unlisted." """

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