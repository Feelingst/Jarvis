# Jarvis

Asistente personal: chat con Claude, dictado por voz y respuestas habladas.
La voz se genera **en local con [VoiceStudio](https://github.com/debpalash/VoiceStudio)**
(ElevenLabs queda como alternativa opcional).

## Uso en el PC (voz local)

1. Instala y abre VoiceStudio. Debe responder en `http://localhost:3900`
   (la API compatible OpenAI está en `/v1/audio/speech`).
2. Copia `.env.example` a `.env.local` y pon tu `ANTHROPIC_API_KEY`.
3. Ejecuta:
   ```
   npm install
   npm run dev
   ```
4. Abre http://localhost:3000

Variables de voz (`.env.local`):

| Variable | Por defecto | Descripción |
|---|---|---|
| `TTS_PROVIDER` | `voicestudio` | `voicestudio` o `elevenlabs` |
| `VOICESTUDIO_URL` | `http://localhost:3900` | Dirección del servidor local |
| `VOICESTUDIO_VOICE` | `default` | Voz de VoiceStudio |
| `VOICESTUDIO_TIMEOUT_MS` | `120000` | Tiempo máximo por frase |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | — | Si existen, se usan si VoiceStudio falla |

La respuesta se trocea en frases: mientras suena una, ya se genera la siguiente.

## Nota sobre Vercel

La voz local **no es accesible desde Vercel** (`localhost` sería el servidor de Vercel).
Para usar VoiceStudio, ejecuta la app en el propio PC (o expón el puerto 3900 con un túnel).
