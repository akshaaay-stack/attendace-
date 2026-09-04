/**
 * Nebula AI client — talks to the Python engine at POST /api/chat
 */
class NebulaAIClient {
  constructor() {
    this.sessionId = localStorage.getItem("nebula-session") || crypto.randomUUID();
    localStorage.setItem("nebula-session", this.sessionId);
    this.endpoint = "/api/chat";
  }

  async ask(message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: this.sessionId }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return {
        text: data.reply || "No reply from Nebula.",
        sources: data.sources || [],
        mode: data.mode || "live",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

window.nebulaAI = new NebulaAIClient();
window.lunarAIEngine = {
  generateResponse() {
    return "Nebula Python is loading. Start the site with `python server.py` so chat can reach /api/chat.";
  },
};
