import yt_dlp
import requests

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import AsyncGroq
from typing import Optional
import os, json, asyncio, re
from duckduckgo_search import DDGS

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

# ==================== WEB SEARCH ====================
def web_search(query: str, max_results: int = 8) -> str:
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return ""
        
        ctx = "🌐 WEB SEARCH RESULTS (use for accurate, latest May 2026 info):\n\n"
        for i, r in enumerate(results, 1):
            title = r.get('title', '')
            body = r.get('body', '')
            href = r.get('href', '')
            if title and body:
                ctx += f"{i}. **{title}**\n   {body}\n   Source: {href}\n\n"
        return ctx
    except Exception:
        return ""

def should_web_search(message: str) -> bool:
    """Determine if query needs real-time web search"""
    triggers = [
        # currency / finance
        r'\b(pkr|usd|eur|gbp|aed|sar|inr|dirham|dollar|pound|euro|rupee|riyal)\b',
        r'\b(price|rate|exchange|convert|stock|crypto|bitcoin|gold|silver)\b',
        r'\b(today|current|latest|now|right now|live|real.?time|2026)\b',
        r'\b(news|update|recent|new|just|happen)\b',
        r'\b(weather|temperature)\b',
        r'\b\d+\s*(usd|pkr|aed|eur|gbp|inr|sar)\b',
        r'\b(to|in)\s*(pkr|usd|aed|eur|gbp|inr|sar)\b',
    ]
    msg_lower = message.lower()
    for pattern in triggers:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return True
    return False

# ==================== YOUTUBE ====================
def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    try:
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(url)
        if 'youtube.com' in parsed.netloc:
            return parse_qs(parsed.query).get('v', [None])[0]
        if 'youtu.be' in parsed.netloc:
            return parsed.path.strip('/')
    except:
        pass
    return None

def get_youtube_transcript(video_id: str) -> tuple[str, str]:
    """Returns (transcript_text, title) or raises exception"""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_text = " ".join([entry['text'] for entry in transcript_list])
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(f'youtube.com/watch?v={video_id}', max_results=1))
                title = results[0].get('title', 'Unknown Video') if results else 'Unknown Video'
        except:
            title = 'Unknown Video'
        return transcript_text, title
    except TranscriptsDisabled:
        raise Exception("This video has disabled transcripts/subtitles.")
    except NoTranscriptFound:
        raise Exception("No transcript found for this video.")
    except Exception as e:
        raise Exception(f"Could not fetch transcript: {str(e)}")

def get_youtube_info(url: str) -> dict:
    """Extract video info without downloading"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            duration_secs = info.get('duration', 0) or 0
            return {
                'title': info.get('title', 'Unknown'),
                'description': info.get('description', '')[:3000],
                'duration': duration_secs,
                'duration_mins': round(duration_secs / 60, 1),
                'channel': info.get('channel', 'Unknown'),
                'upload_date': info.get('upload_date', ''),
                'view_count': info.get('view_count', 0) or 0,
                'categories': info.get('categories', []),
                'tags': info.get('tags', [])[:10],
            }
    except Exception as e:
        raise Exception(f"Could not fetch video info: {str(e)}")

# ==================== SYSTEM PROMPTS ====================
RESPONSE_LENGTH_RULE = """
🎯 RESPONSE LENGTH INTELLIGENCE (CRITICAL):
- Simple/short questions (greetings, definitions, quick facts, conversions, yes/no) → reply in 1-3 sentences MAX. No headers, no bullets.
- Medium questions (how-to, explain a concept) → 1-3 short paragraphs or a brief bullet list.
- Complex questions (deep analysis, long code, essays, comparisons) → full detailed response with structure.
- NEVER pad responses. If 2 sentences answer it, use 2 sentences. Match depth to the actual question.
- Currency/price/rate queries: just state the value and source. Done.
"""

def build_system_prompt(base: str, language: str) -> str:
    prompt = base + f"\n\n{RESPONSE_LENGTH_RULE}"
    prompt += "\n\n📅 TODAY'S DATE: May 8, 2026. Your knowledge and web search results reflect this. Always use the most current information available."
    if language and language != "English":
        prompt += f"\n\n🌐 CRITICAL: Respond ENTIRELY in {language}. Every word must be in {language}. Do NOT use English."
    return prompt

MODES = {
    "tutor": """You are TutorAI, a world-class AI tutor. Knowledge current as of May 2026.

RESPONSE RULES:
- Be warm, encouraging, and patient
- Use bullet points, bold headers, examples WHERE HELPFUL — not always
- Always give real examples for complex topics
- End with a follow-up question ONLY for complex topics, not simple ones
- Simple questions get simple answers. Complex questions get detailed ones.""",

    "code": """You are CodeAI, an expert senior programmer. Knowledge up to May 2026.

RESPONSE RULES:
- Always use proper code blocks with language specified
- Explain WHY the code works, not just what it does
- Point out potential bugs or improvements
- Be concise but complete — like a senior dev doing code review
- For bugs: show broken code, then fixed code, then explain
- Simple code questions get short answers. Architecture questions get detailed ones.""",

    "think": """You are ThinkAI, a deep analytical reasoner. Knowledge up to May 2026.

RESPONSE RULES:
- Think step-by-step for complex problems, show reasoning
- Simple questions: answer directly without unnecessary breakdown
- Use structured analysis (Problem → Analysis → Conclusion) ONLY for complex queries
- Be honest about uncertainty""",

    "creative": """You are CreativeAI, an imaginative creative partner. Knowledge up to May 2026.

RESPONSE RULES:
- Generate unique, original ideas with personality
- Offer 2-3 variations ONLY when brainstorming — not for every reply
- Write with flair, style, and creativity
- Be enthusiastic and inspiring
- Short creative prompts get short creative answers""",

    "youtube": """You are a YouTube Video Analyst. You analyze video transcripts and metadata.

RESPONSE RULES:
- If transcript is available: provide detailed analysis based on actual content
- If only metadata: be transparent, analyze what you have, don't pretend to have watched it
- Structured summary: Overview → Key Points → Takeaways
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
    return {"status": "TutorAI backend is live! v6.0"}

@app.post("/chat")
async def chat(data: Message, session_id: str = Header(default="default")):
    system = build_system_prompt(MODES.get(data.mode, MODES["tutor"]), data.language)

    if data.pdf_context:
        system = f"You have access to this document:\n---\n{data.pdf_context}\n---\n\n" + system

    # Smart web search: always search if query needs real-time data
    if should_web_search(data.message):
        search_context = web_search(data.message)
        if search_context:
            system += f"\n\n{search_context}\n⚠️ IMPORTANT: Use the web search results above for accurate, up-to-date values. Today is May 8, 2026."
    else:
        # Still search for general queries to stay current
        search_context = web_search(data.message)
        if search_context:
            system += f"\n\n{search_context}"

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
                max_completion_tokens=2048,
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
        async def error_stream():
            yield f"data: {json.dumps({'error': 'Invalid YouTube URL. Please paste a valid link like https://youtu.be/VIDEO_ID or https://youtube.com/watch?v=VIDEO_ID'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    system = build_system_prompt(MODES["youtube"], data.language)

    # Strategy 1: Try to get actual transcript first (most accurate)
    transcript_text = None
    transcript_error = None
    try:
        transcript_text, video_title = get_youtube_transcript(video_id)
    except Exception as e:
        transcript_error = str(e)

    # Strategy 2: Get metadata via yt-dlp
    video_info = None
    try:
        video_info = get_youtube_info(data.url)
    except Exception as e:
        if not transcript_text:
            # Both failed
            async def error_stream():
                yield f"data: {json.dumps({'error': f'Could not access this video. It may be private, age-restricted, or unavailable. Error: {str(e)}'})}\n\n"
            return StreamingResponse(error_stream(), media_type="text/event-stream")

    # Build the analysis prompt
    if transcript_text:
        # We have the actual transcript — full analysis
        title = video_info['title'] if video_info else video_title
        channel = video_info['channel'] if video_info else 'Unknown'
        duration_mins = video_info['duration_mins'] if video_info else 'Unknown'
        view_count = f"{video_info['view_count']:,}" if video_info else 'Unknown'

        prompt = f"""Analyze this YouTube video. You have the FULL TRANSCRIPT — use it for detailed analysis.

VIDEO: {title}
CHANNEL: {channel}
DURATION: {duration_mins} minutes
VIEWS: {view_count}

FULL TRANSCRIPT:
{transcript_text[:8000]}

Provide:
1. **Summary** — What this video is about (2-3 sentences)
2. **Key Points** — Main topics covered (bullet points)
3. **Takeaways** — What viewers will learn/gain
4. **Who Should Watch** — Target audience

Base your analysis on the actual transcript content."""

    elif video_info:
        # Metadata only — be transparent
        prompt = f"""Analyze this YouTube video based on its metadata. Note: transcript was unavailable ({transcript_error}).

VIDEO: {video_info['title']}
CHANNEL: {video_info['channel']}
DURATION: {video_info['duration_mins']} minutes
VIEWS: {video_info['view_count']:,}
UPLOAD DATE: {video_info['upload_date']}

DESCRIPTION:
{video_info['description']}

CATEGORIES: {', '.join(video_info['categories'])}
TAGS: {', '.join(video_info['tags'])}

Provide:
1. **Summary** — What this video appears to be about
2. **Key Topics** — Likely subjects covered based on metadata
3. **Target Audience** — Who should watch this
4. **Note** — Mention you're analyzing from metadata only, not the actual video content."""
    else:
        async def error_stream():
            yield f"data: {json.dumps({'error': 'Could not access video data. The video may be private or unavailable.'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    async def generate():
        full_reply = ""
        try:
            stream = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=2048,
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