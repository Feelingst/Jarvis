"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola, soy Jarvis. ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "(sin respuesta)" }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "Error al conectar con Jarvis." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "1px solid #3a7bd5", display: "flex", alignItems: "center",
          justifyContent: "center", background: "rgba(58,123,213,0.15)"
        }}>
          🎙️
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>Jarvis</p>
          <p style={{ margin: 0, fontSize: 12, color: "#8a8a8a" }}>{loading ? "Pensando..." : "Listo"}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            background: m.role === "user" ? "#3a7bd5" : "#1c1c1e",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 14,
            maxWidth: "80%",
            fontSize: 15,
            lineHeight: 1.5,
          }}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe a Jarvis..."
          style={{
            flex: 1, padding: "12px 14px", borderRadius: 10,
            border: "1px solid #333", background: "#1c1c1e", color: "#fff", fontSize: 15,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "0 18px", borderRadius: 10, border: "none",
            background: "#3a7bd5", color: "#fff", fontWeight: 500,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
