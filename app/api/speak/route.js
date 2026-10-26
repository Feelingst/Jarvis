// Voz de Jarvis.
// Por defecto usa VoiceStudio en local (API compatible OpenAI, puerto 3900).
// Si TTS_PROVIDER=elevenlabs (o VoiceStudio no responde y hay clave de ElevenLabs),
// usa ElevenLabs como alternativa.

const VOICESTUDIO_URL = process.env.VOICESTUDIO_URL || "http://localhost:3900";
const VOICESTUDIO_VOICE = process.env.VOICESTUDIO_VOICE || "default";
const VOICESTUDIO_TIMEOUT_MS = Number(process.env.VOICESTUDIO_TIMEOUT_MS || 120000);

async function voiceStudio(text) {
  const response = await fetch(`${VOICESTUDIO_URL}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tts-1",
      voice: VOICESTUDIO_VOICE,
      input: text,
      response_format: "wav",
    }),
    signal: AbortSignal.timeout(VOICESTUDIO_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`VoiceStudio ${response.status}: ${await response.text()}`);
  }
  return {
    audio: await response.arrayBuffer(),
    type: response.headers.get("content-type") || "audio/wav",
  };
}

async function elevenLabs(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
  }
  return { audio: await response.arrayBuffer(), type: "audio/mpeg" };
}

export async function POST(req) {
  const { text } = await req.json();
  if (!text || !text.trim()) {
    return new Response("Texto vacío", { status: 400 });
  }

  const provider = (process.env.TTS_PROVIDER || "voicestudio").toLowerCase();
  const hasEleven = !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
  const order =
    provider === "elevenlabs"
      ? [elevenLabs]
      : hasEleven
      ? [voiceStudio, elevenLabs]
      : [voiceStudio];

  let lastError = "";
  for (const engine of order) {
    try {
      const { audio, type } = await engine(text);
      return new Response(audio, { headers: { "Content-Type": type } });
    } catch (e) {
      lastError = String(e?.message || e);
      console.error("[speak]", lastError);
    }
  }
  return new Response(lastError, { status: 502 });
}
