"use client";

import { useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { useAgriContext } from "@/hooks/useAgriContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AgriChat() {
  const { ndvi, moisture } = useAgriContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemContext, setSystemContext] = useState<string | null>(null);

  const contextLabel = useMemo(() => {
    if (ndvi == null || moisture == null) return "Awaiting live telemetry";
    const health = ndvi >= 0.65 ? "Healthy" : ndvi >= 0.45 ? "Moderate" : "Stressed";
    const moistureLabel = moisture < 0.25 ? "Low" : moisture > 0.45 ? "High" : "Optimal";
    return `NDVI ${ndvi.toFixed(2)} (${health}) · Moisture ${(moisture * 100).toFixed(1)}% (${moistureLabel})`;
  }, [ndvi, moisture]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          context: { ndvi, moisture },
        }),
      });

      if (!response.ok) {
        throw new Error(`Assistant error ${response.status}`);
      }

      const payload = (await response.json()) as { reply: string; context: string };
      setSystemContext(payload.context);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.reply,
        },
      ]);
    } catch (err) {
      console.error(err);
      setError("Unable to reach AI assistant. Check logs.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-black/70 p-6 text-text shadow-2xl shadow-primary/20 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">AI Sentinel</p>
          <h2 className="text-2xl font-semibold text-primary">Field Intelligence Agent</h2>
        </div>
        <span className="text-xs text-muted">{contextLabel}</span>
      </div>
      {systemContext && (
        <p className="mt-4 rounded-2xl border border-primary/20 bg-surface/60 px-4 py-3 text-xs text-muted">
          {systemContext}
        </p>
      )}
      <div className="mt-4 max-h-64 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-primary/15 text-primary"
                : "bg-surface text-text border border-primary/20"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {!messages.length && (
          <p className="text-sm text-muted">
            اسأل الذكاء الميداني عن صحة المحصول، خطط الري، أو المخاطر اللحظية. يتم حقن السياق تلقائيًا من بيانات ESODA.
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <textarea
          className="min-h-[90px] rounded-2xl border border-primary/30 bg-black/50 px-4 py-3 text-sm text-text placeholder-muted focus:border-primary focus:outline-none"
          placeholder="How is my field performing today?"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={pending}
        />
        {error && <p className="text-sm text-[#FF1744]">{error}</p>}
        <button
          type="button"
          onClick={handleSend}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-background transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}
