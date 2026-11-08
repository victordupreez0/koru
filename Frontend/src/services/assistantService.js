// Client for the streaming assistant endpoint (see the assistant contract).
// Provider fallback lives on the server; the browser never holds an API key.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

const GENERIC_ERROR = "Unable to reach the assistant. Please try again in a moment.";

/**
 * Incremental Server-Sent Events parser. Feed it text chunks (which may split
 * mid-line); it calls onEvent({ event, data }) at every blank-line dispatch.
 */
export function createSseParser(onEvent) {
  let buffer = "";
  let eventName = "message";
  let dataLines = [];

  const dispatch = () => {
    if (dataLines.length > 0) onEvent({ event: eventName, data: dataLines.join("\n") });
    eventName = "message";
    dataLines = [];
  };

  const handleLine = (line) => {
    if (line === "") return dispatch();
    if (line.startsWith(":")) return; // comment
    const idx = line.indexOf(":");
    const field = idx === -1 ? line : line.slice(0, idx);
    let value = idx === -1 ? "" : line.slice(idx + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") eventName = value;
    else if (field === "data") dataLines.push(value);
  };

  return {
    push(chunk) {
      buffer += chunk;
      let match;
      while ((match = /\r\n|\n|\r/.exec(buffer))) {
        // A lone trailing \r may be the first half of \r\n; wait for more.
        if (match[0] === "\r" && match.index === buffer.length - 1) break;
        const line = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        handleLine(line);
      }
    },
    end() {
      if (buffer) handleLine(buffer.replace(/\r$/, ""));
      buffer = "";
      dispatch();
    },
  };
}

/** Hand validation of the result payload. Returns a normalised result or null. */
export function normalizeResult(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.ok === false) {
    return {
      ok: false,
      error: typeof raw.error === "string" && raw.error.trim() ? raw.error : GENERIC_ERROR,
    };
  }
  if (raw.ok !== true) return null;
  if (typeof raw.message !== "string" || !raw.message.trim()) return null;
  const question = typeof raw.question === "string" && raw.question.trim() ? raw.question.trim() : null;
  const summary = typeof raw.context?.summary === "string" ? raw.context.summary : "";
  return {
    ok: true,
    message: raw.message,
    question,
    context: { summary },
    provider: typeof raw.provider === "string" ? raw.provider : "none",
    fallback: raw.fallback === true,
  };
}

const isAbort = (err) => err?.name === "AbortError";

/**
 * Streams an assistant reply.
 * Resolves with the result object ({ ok:true, ... } or { ok:false, error }).
 * Rejects only with an AbortError when `signal` aborts.
 */
export async function streamAssistant({ messages, userId, role, signal, onStage } = {}) {
  let result = null;

  const onEvent = ({ event, data }) => {
    let payload;
    try { payload = JSON.parse(data); } catch { return; }
    if (event === "stage") {
      if (payload && typeof payload.text === "string" && payload.text) {
        try { onStage?.({ stage: payload.stage, text: payload.text }); } catch { /* UI callback must not break parsing */ }
      }
    } else if (event === "result") {
      result = normalizeResult(payload) ?? { ok: false, error: "The assistant sent a reply I could not read. Please try again." };
    }
  };

  try {
    const res = await fetch(`${API_BASE}/Assistant/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        messages: (messages || []).filter((m) => m.role === "user" || m.role === "assistant"),
        userId,
        role,
      }),
      signal,
    });

    if (!res.ok) {
      let msg = GENERIC_ERROR;
      try {
        const body = await res.json();
        if (typeof body?.message === "string" && body.message) msg = body.message;
        else if (typeof body?.error === "string" && body.error) msg = body.error;
      } catch { /* keep generic */ }
      return { ok: false, error: msg };
    }

    if (!res.body?.getReader) return { ok: false, error: GENERIC_ERROR };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const parser = createSseParser(onEvent);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
      if (result) break;
    }
    if (!result) {
      parser.push(decoder.decode());
      parser.end();
    } else {
      try { reader.cancel?.(); } catch { /* ignore */ }
    }
  } catch (err) {
    if (isAbort(err) || signal?.aborted) {
      const abort = new Error("Aborted");
      abort.name = "AbortError";
      throw abort;
    }
    return { ok: false, error: GENERIC_ERROR };
  }

  return result ?? { ok: false, error: "The assistant stopped before it finished a reply. Please try again." };
}

export { isAbort as isAbortError };

// POST /api/Assistant/generate-quiz – returns drafted questions for the lecturer to review
export async function generateQuizDraft(text, count, userId) {
  const res = await fetch(`${API_BASE}/Assistant/generate-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, count, userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "The AI assistant isn't available right now. You can still write the questions yourself.");
  return data.questions;
}
