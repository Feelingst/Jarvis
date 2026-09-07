export async function POST(req) {
  const { messages } = await req.json();

  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "Eres Jarvis, un asistente personal. Respondes en el idioma en que te escriben (español, francés o inglés). Eres claro, directo y cercano.",
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return Response.json({ reply: "Error de la API: " + errText }, { status: 500 });
  }

  const data = await response.json();
  const reply = data.content?.map((c) => c.text || "").join("") || "";

  return Response.json({ reply });
}
