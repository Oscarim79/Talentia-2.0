# Videos de ayuda (ayuda integrada)

Hay dos videos en Ayuda → Video, ambos narrados con voz en español y con subtítulos incrustados:

| Video | Archivos | Guion | Grabación |
|---|---|---|---|
| Recorrido completo (3 min) | `public/ayuda/tour-talentia.mp4` / `.webm` | `narration.json` | `record2.mjs` |
| Entrevistas IA por videollamada (2 min) | `public/ayuda/entrevistas-ia.mp4` / `.webm` | `entrevistas-ia/narration.json` | `entrevistas-ia/record.mjs` |

No requieren claves ni servicios externos.

1. **Guion** — `narration.json`: segmentos `{ id, text, say? }`. `text` se narra y se muestra como subtítulo; `say` (opcional) es cómo se pronuncia cuando difiere del subtítulo (ej. "Entrevistas IA" → "Entrevistas i a").
2. **Voz** — `synth.py`: sintetiza cada segmento con Piper (`sherpa-onnx`, modelo `vits-piper-es_MX-claude-high`, descargable de las releases de `k2-fsa/sherpa-onnx`) y guarda `audio/<id>.wav` + `audio/durations.json`. Se corre dentro de una carpeta de trabajo que tenga el `narration.json` y el modelo.
3. **Grabación** — con Playwright abre la app compilada (`vite preview` en `:4179`), recorre las pantallas al ritmo de cada segmento (espera al menos la duración de su audio) y guarda `<video>/raw.webm` + `<video>/marks.json` (segundo en que empezó cada segmento). `record2.mjs` usa la carpeta `video2/`; `entrevistas-ia/record.mjs` usa `video/` y acepta la URL base como segundo argumento.
4. **Mezcla** — `mix.py <carpeta> <nombre> [video|video2]` arma `narration.wav` colocando cada audio en su marca y exporta MP4 (H.264 + AAC) y WebM (VP8 + Opus). Equivale a:
   `ffmpeg -i raw.webm -i narration.wav -c:v libx264 -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -shortest <nombre>.mp4`
5. Copiar los dos archivos a `public/ayuda/` y actualizar los capítulos en `src/features/help/tourSteps.ts` (`VIDEO_CHAPTERS` o `INTERVIEWS_AI_VIDEO_CHAPTERS`) con las marcas de `marks.json`.

Si cambia una pantalla, basta con editar el guion y volver a correr los pasos 2–5 (o pedir a Claude "regraba el video del tour" / "regraba el video de Entrevistas IA").
