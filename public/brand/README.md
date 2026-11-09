# Logo de TALENTIA (wordmark)

Logo solo con texto: **talent** en verde bosque (`brand-800`, `#0a4936`) e **ia** en dorado (`gold-500`, `#c99043`), en Bricolage Grotesque (peso 680), la misma tipografía de los títulos de la app. El texto está convertido a trazados: los SVG se ven igual en cualquier dispositivo sin instalar fuentes.

| Archivo | Uso |
|---|---|
| `talentia-logo.svg` / `.png` | Fondos claros (marfil, blanco). Versión principal. |
| `talentia-logo-dark.svg` / `.png` | Fondos oscuros (sidebar, portadas): blanco + dorado claro. |
| `talentia-logo-mono.svg` | Un solo color (`currentColor`): documentos, sellos, grabados. |
| `talentia-logo-tagline.svg` / `.png` | Con la línea "RECLUTAMIENTO CON IA" (IBM Plex Mono). |
| `talentia-logo-tagline-dark.svg` / `.png` | Igual, para fondos oscuros. |
| `muestra.png` | Hoja de muestra de todas las variantes. |

Los PNG tienen 1600 px de ancho (fondo transparente en las versiones claras).

Para regenerarlos tras cambiar colores, peso o tagline: `python3 scripts/make-logo.py` (requiere `pip install fonttools brotli uharfbuzz`; usa las fuentes de `node_modules`).
