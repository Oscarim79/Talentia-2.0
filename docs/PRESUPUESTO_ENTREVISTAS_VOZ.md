# Presupuesto — Entrevistas IA por voz en la videollamada (opción completa)

Fecha: 2026-11-10. Decisión de Oscar: ir directo a la **opción completa** (el asistente de IA entra a la videollamada y entrevista hablando) y **arrancar la semana del 16 de noviembre de 2026**.

Este documento responde dos preguntas: **cuánto cuestan las pruebas** y **cuánto cuesta salir en vivo**. Los precios son los oficiales de cada proveedor consultados el 2026-11-10 (tabla en la sección 9). Todo está en dólares.

**La cifra para recordar: una entrevista por voz cuesta ≈ $0.10 por minuto, todo incluido.** Una entrevista de Vendedor (45 min según la guía de RR.HH.) sale en ≈ $4.70; una de Jefe de Tienda (60 min) en ≈ $6.30. Con margen, presupuestar **$6 y $8**.

---

## 1. Qué vamos a construir

El candidato recibe su enlace de Zoom como hoy. A la hora acordada entra el **asistente de Talentia** (una ventana con el logo y voz propia), lo saluda, le hace las preguntas de la guía de competencias de RR.HH. (Vendedor: 16 preguntas, 45 min; Jefe de Tienda: 19 preguntas, 60 min), repregunta cuando hace falta y se despide. La llamada queda grabada y transcrita. Al terminar, Claude califica cada respuesta contra la guía, detecta lo que no cuadra con el CV y deja la evaluación lista en la sección Entrevistas. El reclutador puede mirar en vivo o solo leer la evaluación.

Piezas (todas de pago por uso, sin servidores propios):

| Pieza | Quién la hace | Para qué |
|---|---|---|
| Asistente dentro de la videollamada | **Recall.ai** | Entra al Zoom o Meet, muestra la ventana del asistente, graba y transcribe |
| Voz en tiempo real (escuchar, hablar, turnos) | **Vapi** (alternativa: ElevenLabs Agents) | Convierte la voz del candidato en texto y la respuesta en voz, sin cortes |
| Cerebro de la entrevista | **Claude Sonnet 5.5** (ya configurado desde la Entrega B) | Sigue la guía pregunta por pregunta y califica al final |
| Datos, claves y lógica | **Supabase** (ya existe) | Funciones con las claves, registro de consumo (`ai_calls`), transcripciones y evaluaciones |

---

## 2. Supuestos (si cambian, cambia el número)

1. **Duración según la guía de RR.HH.:** Vendedor 45 minutos, Jefe de Tienda 60 minutos. Con la IA puede salir más corta (no hay charla de pasillo), pero se presupuesta con la guía. Regla: **cada minuto cuesta ≈ $0.10**.
2. **Zoom.** Reynaldo confirmó (2026-09-23) que entrevistan por Zoom. Recall.ai cuesta lo mismo en Zoom que en Google Meet. La diferencia es un trámite: en Zoom la empresa registra una app gratuita para el asistente; en Meet basta con que el entrevistador lo admita en la llamada.
3. **Voz con Vapi en pago por uso** (sin cuota mensual) y Claude como cerebro. ElevenLabs Agents cuesta parecido por minuto pero exige un plan mensual (desde $22).
4. **Guardamos transcripción y evaluación**, no el video. El audio queda 7 días gratis en Recall.ai y luego se borra (o se conserva por $0.05 por hora cada 30 días).
5. **Margen del 25 %** en las cifras "presupuestadas": los proveedores facturan por segundo y por token, y las primeras semanas siempre hay reintentos.

---

## 3. Costo de una entrevista

### Por minuto de llamada

| Concepto | Precio | Por minuto |
|---|---|---|
| Asistente en la llamada (Recall.ai, bot de 4 núcleos para que el audio no se corte) | $0.60 por hora | $0.010 |
| Transcripción (Recall.ai) | $0.15 por hora | $0.003 |
| Alojamiento de la voz (Vapi) | $0.05 por minuto | $0.050 |
| Reconocimiento de voz (Deepgram vía Vapi) | ≈ $0.0095 por minuto | $0.010 |
| Voz sintética (ElevenLabs vía Vapi) | $0.015 a $0.024 por minuto | $0.015 a $0.024 |
| Cerebro de la conversación (Claude Sonnet 5.5, con caché) | ≈ $0.01 por minuto de conversación | $0.010 |
| **Total por minuto** | | **≈ $0.10** |

Más la **evaluación final** con Claude al terminar: $0.05 a $0.15 por entrevista (transcripción + guía + CV).

### Por entrevista

| Duración | Estimado | **Presupuestado (con margen)** | Caso |
|---|---|---|---|
| 30 min | ≈ $3.20 | **$4** | Si la IA resulta más rápida que la guía |
| 45 min | ≈ $4.70 | **$6** | **Vendedor** (la mayoría de las entrevistas) |
| 60 min | ≈ $6.30 | **$8** | **Jefe de Tienda** |

Para los cálculos de abajo uso el caso Vendedor: **$4.70 estimado y $6.00 presupuestado**.

Lo caro es la voz (Vapi: ≈ $0.08 de cada $0.10). La inteligencia (Claude) es alrededor del 10 %.

---

## 4. Cuánto cuestan las pruebas

### Fase A — construcción y pruebas internas (semanas 1 a 5)

El equipo de RR.HH. y Oscar hacen de candidatos. Supuesto: **40 llamadas de prueba de ~15 minutos** (600 minutos), más las pruebas en texto del agente.

| Concepto | Cálculo | Costo |
|---|---|---|
| Vapi (voz) | 600 min × ≈ $0.09, menos $5 de regalo | $50 |
| Recall.ai | 10 h, las primeras 5 son gratis → 5 h × $0.60 | $3 |
| Transcripción | 10 h × $0.15 | $2 |
| Claude (cerebro, evaluaciones y pruebas en texto) | | $15 |
| **Estimado Fase A** | | **≈ $70** |
| **Presupuestado Fase A** | | **$100** |

### Fase B — piloto con candidatos reales (semanas 6 a 8)

**Una vacante real de Vendedor, 30 entrevistas de 45 minutos.** Aquí se miden la duración real, cuántos candidatos abandonan y qué opinan.

| Concepto | Cálculo | Costo |
|---|---|---|
| 30 entrevistas × $4.70 | | $141 |
| Si fueran de Jefe de Tienda (60 min) | 30 × $6.30 | $189 |
| **Presupuestado Fase B** | | **$200** |

### Total de la etapa de pruebas

| | Estimado | Presupuestado |
|---|---|---|
| Fase A + Fase B | ≈ $210 | **$300** |

Durante las pruebas **no hay cuotas mensuales**: Vapi y Recall.ai son pago por uso, Supabase sigue en plan gratis y la cuenta de Anthropic ya tiene saldo.

**Costo de construir:** el tiempo de Oscar y la suscripción de Claude que ya paga: entre 10 y 20 sesiones de trabajo repartidas en 1 a 2 meses. No hay que contratar a nadie ni alquilar servidores.

---

## 5. Cuánto cuesta salir en vivo (por mes)

### Costos fijos

| Concepto | Costo mensual | Nota |
|---|---|---|
| **Supabase Pro** | **$25** | Recomendado al salir en vivo. Hoy el proyecto está en plan gratis: se pausa si nadie lo usa 7 días, no tiene respaldos diarios y solo guarda 1 GB de archivos. Con Pro: sin pausas, respaldos diarios, 100 GB. |
| Vapi Core | $29 | **Solo si** hay más de 4 entrevistas a la misma hora (el plan gratis permite 4 simultáneas; Core permite 10). |
| Recall.ai, Anthropic | $0 | Sin cuota; solo pago por uso. |
| Zoom | $0 extra | La empresa ya lo paga; la app del asistente es gratuita. |

### Costos variables según el volumen (entrevistas de Vendedor, 45 min)

| Entrevistas al mes | Variable estimado ($4.70) | Variable presupuestado ($6.00) | **Total mensual presupuestado** (con Supabase Pro) |
|---|---|---|---|
| 50 | $235 | $300 | **≈ $325** |
| 100 | $470 | $600 | **≈ $625** |
| 200 | $940 | $1,200 | **≈ $1,225** |
| 400 | $1,880 | $2,400 | **≈ $2,425** |

Si una parte son Jefes de Tienda (60 min), sumar $2 por cada una de esas.

Regla rápida para el CEO: **una entrevista completa hecha por la IA cuesta entre $5 y $8**, menos que la hora de un reclutador, y el reclutador recibe la evaluación ya calificada. El número que falta para cerrar el presupuesto es **cuántas entrevistas al mes hace Americana 2000** (decisión pendiente, sección 10).

---

## 6. Dónde se puede ahorrar

| Palanca | Ahorro | Qué implica |
|---|---|---|
| **Entrevistas más cortas**: la IA no necesita los 45 min de la guía si las respuestas son concretas | ≈ $0.50 por cada 5 minutos menos (30 min en vez de 45 = $1.50 menos por entrevista) | Se mide en la Fase B |
| **Enlace propio en vez de Zoom/Meet**: el candidato abre un enlace de Talentia y la entrevista ocurre en el navegador, con voz y video | ≈ $0.60 por entrevista y se evita la app de Zoom | Decisión de RR.HH.; funciona igual en todo el país |
| **Claude Haiku 5.5 como cerebro** (si la calidad aguanta en las pruebas) | ≈ $0.40 por entrevista | Se decide con los resultados de la Fase A |
| **ElevenLabs Agents en vez de Vapi** | parecido por minuto ($0.08 + modelo) | Conviene si el volumen cabe en su plan Pro ($99 con 1,238 minutos ≈ 27 entrevistas de 45 min) |

---

## 7. Qué NO incluye este presupuesto

- Citar a los candidatos por WhatsApp (Twilio/Meta): es otra entrega.
- Avatar de video realista del entrevistador (HeyGen/D-ID): fase futura; el asistente mostrará una ventana con el logo y la voz.
- Entrevistas por teléfono sin video: no aplica a Americana 2000.
- Volver a grabar los videos de ayuda de la app (pendiente desde antes).

---

## 8. Plan de arranque (semana del 16 de noviembre de 2026)

### Trámites de Oscar (antes o durante la semana 1)

1. **Cuenta en Recall.ai** (pago por uso, tarjeta, 5 horas gratis). La clave va como secreto en Supabase, igual que la de Anthropic. Nunca pegarla en el chat.
2. **Cuenta en Vapi** (pago por uso, $5 de regalo). Misma regla para la clave.
3. **App de Zoom**: pedir al administrador de la cuenta de Zoom de Americana 2000 que cree la app para el asistente siguiendo la guía de Recall.ai (gratis). Alternativas: Google Meet (sin trámite) o el enlace propio de la sección 6.
4. **Saldo en Anthropic**: ya existe desde la Entrega B.

### Construcción (sesiones con Claude Code)

| Semanas | Bloque | Resultado |
|---|---|---|
| 1 a 2 | **Cerebro** (parte de la Entrega C): el agente de entrevistas con Claude real en texto, siguiendo la guía; evaluación final real; registro en `ai_calls` | Se puede entrevistar por chat con IA de verdad |
| 3 a 4 | **Voz y videollamada**: agente en Vapi conectado al cerebro; ventana del asistente que Recall.ai muestra en la llamada; botón "Enviar el asistente" desde Respuestas a CVs; recibir grabación y transcripción; evaluación automática | El asistente entra al Zoom de prueba y conversa |
| 5 | **Fase A**: pruebas internas; ajustar voz, ritmo, interrupciones, ruido | Lista para candidatos |
| 6 a 8 | **Fase B**: piloto con una vacante real; medir duración, abandono y opinión de candidatos y reclutadores | Números reales |
| después | **Decisión de salida en vivo** con los números reales: volumen, Supabase Pro, Vapi Core si hace falta | En producción |

---

## 9. Precios usados (consultados el 2026-11-10)

| Proveedor | Precio | Fuente |
|---|---|---|
| Recall.ai | $0.50/h bot estándar; $0.60/h bot de 4 núcleos; $0.15/h transcripción; 5 h gratis; almacenamiento 7 días gratis y luego $0.05/h por 30 días | https://www.recall.ai/pricing y https://docs.recall.ai/docs/stream-media |
| Vapi | $0.05/min alojamiento; proveedores al costo (Deepgram ≈ $0.0095/min, ElevenLabs $0.015–0.024/min); $5 gratis; 4 llamadas simultáneas; Core $29/mes (10 simultáneas) | https://vapi.ai/pricing |
| ElevenLabs Agents | $0.08/min; planes Starter $6 (75 min), Creator $22 (275 min), Pro $99 (1,238 min); modelo aparte | https://elevenlabs.io/pricing/agents |
| Claude Sonnet 5.5 | $2 por millón de tokens de entrada, $10 de salida; lectura de caché $0.10 | https://platform.claude.com/docs/en/about-claude/pricing |
| Claude Haiku 5.5 | $0.10 entrada, $0.50 salida | misma fuente |
| Supabase Pro | $25/mes | https://supabase.com/pricing |
| Google Meet Media API (acceso directo de Google al audio) | No disponible: en vista previa para desarrolladores y con cierre anunciado | https://developers.google.com/workspace/meet/release-notes |

---

## 10. Decisiones pendientes de Oscar

1. **Volumen mensual esperado** de entrevistas (define el presupuesto de la sección 5).
2. **Zoom, Meet o enlace propio** (sección 6).
3. **Voz del asistente** (hombre o mujer, acento): se elige en la Fase A escuchando opciones.
4. **¿El reclutador mira en vivo** o solo lee la evaluación después? Cambia la pantalla de Entrevistas, no el costo.
