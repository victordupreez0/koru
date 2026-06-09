// Service to handle interactions with the Groq AI model
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

function buildSystemInstruction(role) {
  const roleContext = role === "student"
    ? "You are conversing with a student. Help them understand course material, assignments, study strategies, and academic concepts. Provide encouraging, clear explanations tailored to a learner."
    : "You are conversing with a teacher/administrator. Assist with creating structured timetables, writing detailed and encouraging student feedback, creating detailed module/lesson plans, explaining academic analytics, and drafting class announcements.";

  return {
    role: "system",
    content: "You are a helpful, professional, and knowledgeable AI Assistant for the LearnOnline educational platform. " +
              roleContext + " " +
              "Always respond in clear, professional, and engaging English. Use clean Markdown formatting with bolding, " +
              "bullet points, and structured tables where appropriate to present information beautifully."
  };
}

/**
 * Sends chat messages to the AI Assistant and returns the response content.
 * First, it tries the secure backend proxy. If that fails because the backend is
 * missing the API key, it falls back to a direct call if VITE_GROQ_API_KEY is available.
 * 
 * @param {Array} chatHistory - Array of { role, content } messages
 * @param {string} userId - ID of the logged-in user
 * @param {string} role - Role of the logged-in user
 * @returns {Promise<Object>} Object containing { role: "assistant", content: string }
 */
export async function getAssistantResponse(chatHistory, userId, role) {
  // 1. Try to call the secure backend proxy first
  try {
    const res = await fetch(`${API_BASE}/Assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages: chatHistory,
        userId: userId,
        role: role
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    // If it failed, let's see why. If it is a bad request or unauthorized, we can fallback
    const errorData = await res.json().catch(() => ({}));
    console.warn("Backend proxy returned error, attempting client-side fallback:", errorData.message || res.statusText);
    
    // Throw an error with backend message so we can inspect and decide
    throw new Error(errorData.message || "Backend error");
  } catch (backendError) {
    // 2. Fall back to direct Groq API client-side call if key is set in .env
    const clientApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (clientApiKey && clientApiKey.trim().length > 0) {
      console.log("Using client-side VITE_GROQ_API_KEY direct fallback to Groq Cloud.");
      
      const messagesToSend = [
        buildSystemInstruction(role),
        ...chatHistory.filter(msg => msg.role !== "system" && msg.content && msg.content.trim())
      ];

      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${clientApiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: messagesToSend,
            temperature: 0.7,
            max_completion_tokens: 4096
          })
        });

        if (!groqRes.ok) {
          const groqError = await groqRes.json().catch(() => ({}));
          throw new Error(groqError?.error?.message || `Groq direct API error (status ${groqRes.status})`);
        }

        const data = await groqRes.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return { role: "assistant", content };
        } else {
          throw new Error("Empty response from Groq Cloud.");
        }
      } catch (clientError) {
        throw new Error(`Direct API fallback failed: ${clientError.message}`);
      }
    }

    // If we reach here, neither server key nor frontend key was configured
    const userMessage = backendError.message.includes("not configured") 
      ? backendError.message 
      : "Groq API Key is not configured. Please add your key to Backend/LearnOnline/appsettings.Development.json ('Groq': { 'ApiKey': '...' }) or Frontend/.env (VITE_GROQ_API_KEY=...).";

    throw new Error(userMessage);
  }
}
