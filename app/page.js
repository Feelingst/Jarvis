"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola, soy Jarvis. ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("es-ES");
  const bottomRef = useRef(null);
  const audioRef = useRef(null);
  const speakRunRef = useRef(0);
  const recognitionRef = useRef(null);

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta dictado por voz. Prueba con Chrome o Safari actualizado.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  // Trocea la respuesta en frases para empezar a hablar antes
  // (la voz local en CPU es lenta con textos largos).
  function splitSentences(text) {
    const clean = text
      .replace(/[*_`#>]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const parts = clean.match(/[^.!?¡¿\n]+[.!?]*\s*/g) || [clean];
    const out = [];
    let buf = "";
    for (const p of parts) {
      buf += p;
      if (buf.length >= 40) {
        out.push(buf.trim());
        buf = "";
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  async function fetchAudio(text) {
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return null;
      return URL.createObjectURL(await res.blob());
    } catch (e) {
      return null;
    }
  }

  function playUrl(url) {
    return new Promise((resolve) => {
      const audio = audioRef.current;
      if (!audio) return resolve();
      const done = () => {
        audio.onended = null;
        audio.onerror = null;
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      audio.src = url;
      audio.play().catch(done);
    });
  }

  function stopSpeaking() {
    speakRunRef.current++;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.dispatchEvent(new Event("ended"));
    }
    setSpeaking(false);
  }

  async function speak(text) {
    if (!voiceOn || !text) return;
    const runId = ++speakRunRef.current;
    const parts = splitSentences(text);
    if (!parts.length) return;
    setSpeaking(true);
    try {
      let next = fetchAudio(parts[0]);
      for (let i = 0; i < parts.length; i++) {
        const current = next;
        // Genera la frase siguiente mientras suena la actual
        if (i + 1 < parts.length) next = fetchAudio(parts[i + 1]);
        const url = await current;
        if (speakRunRef.current !== runId) return;
        if (url) await playUrl(url);
        if (speakRunRef.current !== runId) return;
      }
    } finally {
      if (speakRunRef.current === runId) setSpeaking(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    stopSpeaking();
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
      const reply = data.reply || "(sin respuesta)";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      speak(reply);
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
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 500 }}>Jarvis</p>
          <p style={{ margin: 0, fontSize: 12, color: "#8a8a8a" }}>
            {loading ? "Pensando..." : speaking ? "Hablando..." : "Listo"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, marginRight: 4 }}>
          {[
            { code: "es-ES", label: "ES" },
            { code: "fr-FR", label: "FR" },
            { code: "en-US", label: "EN" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                fontSize: 11, padding: "4px 8px", borderRadius: 8,
                border: lang === l.code ? "1px solid #3a7bd5" : "1px solid #333",
                background: lang === l.code ? "rgba(58,123,213,0.2)" : "transparent",
                color: "#fff",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (speaking) stopSpeaking();
            setVoiceOn(!voiceOn);
          }}
          style={{
            width: 36, height: 36, borderRadius: "50%", border: "1px solid #333",
            background: voiceOn ? "#3a7bd5" : "#1c1c1e", color: "#fff", fontSize: 16,
          }}
          aria-label={voiceOn ? "Desactivar voz" : "Activar voz"}
        >
          {voiceOn ? "🔊" : "🔇"}
        </button>
      </div>
      <audio ref={audioRef} style={{ display: "none" }} />


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
        <button
          onClick={listening ? stopListening : startListening}
          style={{
            width: 44, height: 44, borderRadius: 10, border: "none", flexShrink: 0,
            background: listening ? "#d64545" : "#1c1c1e",
            color: "#fff", fontSize: 18,
          }}
          aria-label={listening ? "Detener dictado" : "Hablar a Jarvis"}
        >
          {listening ? "⏹️" : "🎤"}
        </button>
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
