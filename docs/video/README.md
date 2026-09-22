# Video de recorrido (ayuda integrada)

`public/ayuda/tour-talentia.mp4` se genera con estos tres archivos. No requiere claves ni servicios externos.

1. **Guion** — `narration.json`: segmentos `{ id, text }`. El mismo texto se narra y se muestra como subtítulo.
2. **Voz** — `synth.py`: sintetiza cada segmento con Piper (`sherpa-onnx`, modelo `vits-piper-es_MX-claude-high`, descargable de las releases de `k2-fsa/sherpa-onnx`) y guarda `audio/<id>.wav` + `audio/durations.json`.
3. **Grabación** — `record2.mjs`: con Playwright abre la app compilada (`vite preview`), recorre las pantallas al ritmo de cada segmento (espera al menos la duración de su audio) y guarda `video2/raw.webm` + `video2/marks.json` (segundo en que empezó cada segmento).
4. **Mezcla** — se arma `narration.wav` colocando cada audio en su marca y se muxea con ffmpeg:
   `ffmpeg -i raw.webm -i narration.wav -c:v libx264 -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -shortest tour-talentia.mp4`
5. Actualizar `VIDEO_CHAPTERS` en `src/features/help/tourSteps.ts` con las marcas de los capítulos.

Si cambia una pantalla, basta con editar el guion y volver a correr los pasos 2–5.
