const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getSessionId(): string {
  let id = localStorage.getItem("tutorai_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tutorai_session", id);
  }
  return id;
}

async function streamResponse(
  response: Response,
  signal: AbortSignal | undefined,
  onChunk?: (chunk: string) => void,
  onStart?: () => void,
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullReply = "";
  let hasStarted = false;
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(line.slice(6));
          if (json.error) throw new Error(json.error);
          if (json.chunk) {
            if (!hasStarted) {
              hasStarted = true;
              onStart?.();
            }
            fullReply += json.chunk;
            onChunk?.(json.chunk);
          }
          if (json.done) break;
        } catch (parseErr: any) {
          // Only rethrow if it's a real error (not a JSON parse error on malformed chunk)
          if (
            parseErr instanceof Error &&
            parseErr.message !== "Unexpected end of JSON input"
          ) {
            throw parseErr;
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError" || signal?.aborted) return fullReply;
    throw err;
  } finally {
    try {
      reader.cancel();
    } catch {}
  }
  return fullReply;
}

export async function sendMessage(
  message: string,
  mode: string,
  pdfContext: string,
  imageData?: string,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void,
  onStart?: () => void,
  language: string = "English",
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "session-id": getSessionId(),
      },
      body: JSON.stringify({
        message,
        mode,
        pdf_context: pdfContext,
        image_data: imageData || null,
        language,
      }),
      signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") return "";
    throw new Error("Failed to fetch");
  }
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return streamResponse(response, signal, onChunk, onStart);
}

export async function summarizeYouTube(
  url: string,
  language: string = "English",
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/youtube`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "session-id": getSessionId(),
      },
      body: JSON.stringify({ url, language }),
      signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") return "";
    throw new Error("Failed to fetch");
  }
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return streamResponse(response, signal, onChunk);
}

export async function resetConversation(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "session-id": getSessionId(),
      },
      body: JSON.stringify({}),
    });
  } catch {}
}
