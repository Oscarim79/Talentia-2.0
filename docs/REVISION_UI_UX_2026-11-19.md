# Revisión UI/UX de Talentia Labs con la skill `ui-ux-pro-max` (2026-11-19)

> Hecha por Claude el 2026-11-19 con la skill [UI UX Pro Max v2.15](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (instalada ese día en `~/.claude/skills/ui-ux-pro-max/`, disponible en todos los proyectos).
> **Estado: las 10 opciones se aplicaron el mismo día** (rama `ui-ux-revision-2026-11-19`, unida a `main`). La sección "Qué se hizo" dice exactamente qué cambió y qué queda por mirar en vivo.

## Cómo se hizo

1. Se corrió el generador de sistema de diseño de la skill para "HR recruiting SaaS dashboard" y las búsquedas de reglas UX, gráficas, iconos, React y Tailwind.
2. Se cruzó cada regla con el código real de la app (conteos con `grep` sobre `src/`).
3. Se descartó lo que choca con decisiones firmes del proyecto (marca de 4 colores, tipografías ya elegidas).
4. Oscar pidió aplicar todo. Se hizo con pruebas primero (17 pruebas nuevas, 142 en total), `tsc`, `check:help` y `build`.

## Resumen en una frase

La app ya cumplía el estilo que la skill recomienda para reclutamiento (plano, minimalista, alto contraste, sin modo oscuro). Lo que faltaba era **legibilidad** (texto muy pequeño), **formularios que expliquen el error**, **foco en las ventanas emergentes** y **gráficas que no dependan solo del color**. Ya está.

## Qué se hizo (por opción)

| # | Opción | Qué cambió | Dónde |
|---|--------|------------|-------|
| 1 | Texto mínimo | Ningún texto baja de 12 px (`text-xs`). Las etiquetitas en mayúsculas usan la clase nueva `eyebrow` (11 px, mono). Una prueba automática impide volver a meter tamaños menores. Además, el gris de los textos secundarios en pantallas claras subió de `neutral-400` a `neutral-500` (contraste 4.7:1, antes 2.6:1). | 16 archivos; `src/index.css`; `src/lib/typography.test.ts` |
| 2 | Errores junto al campo | Componente `Field` compartido (etiqueta enlazada, ayuda y error con `aria-describedby`/`aria-invalid`). En el wizard de vacantes "Siguiente" ya no se apaga: valida, muestra el error debajo de cada campo y un resumen enfocable arriba con enlaces a cada campo. Configuración: error al agregar una persona sin nombre; metas con texto de ayuda. Login usa `Field`. | `src/components/ui/Field.tsx`, `src/features/jobs/jobValidation.ts`, `JobWizard.tsx`, `SettingsPage.tsx`, `LoginPage.tsx` |
| 3 | Foco en ventanas emergentes | Hook `useDialogFocus`: el foco entra al abrir, Tab y Shift+Tab dan la vuelta dentro, y al cerrar vuelve al botón que abrió. Aplicado a Confirmación, wizard de vacantes, perfil de persona, reporte de equipo, mensaje de Respuestas a CVs, Bienvenida y ayuda de módulo. | `src/lib/dialogFocus.ts` (+ prueba) |
| 4 | Tooltips táctiles | Componente `Tooltip` (cursor, teclado y toque; `role="tooltip"`). `Badge title=` ahora lo usa en vez del `title` del navegador. Donde era una explicación importante se volvió texto visible (selector de vacante ocupado, cambio de guía bloqueado, leyenda de Acciones RR.HH.). Se quitaron los `title` redundantes. | `src/components/ui/Tooltip.tsx`, `primitives.tsx`, Screening, Entrevista por competencias, Acciones, Perfil, Métricas |
| 5 | Nombres e iconos | `aria-label` en los botones de solo icono (quitar pregunta, descargar preguntas, enviar mensaje). Los emojis de empresa se sustituyeron por un monograma (`nameInitials`: "Americana 2000" → "A2") y el avatar muestra las iniciales de la persona. | `Topbar.tsx`, `AdminPage.tsx`, `src/lib/utils.ts` |
| 6 | Embudo | El Dashboard muestra un embudo acumulado (quiénes llegaron a cada etapa o más allá), con conteo y % respecto a la etapa anterior sobre cada barra, aviso de la mayor caída y una lista equivalente para lectores de pantalla. | `src/features/dashboard/funnel.ts` (+ prueba), `DashboardPage.tsx` |
| 7 | 9-Box legible | Cada celda dice su nombre legible y cuántas personas tiene (también para lector de pantalla); cada persona es un botón con nombre y puntajes (funciona con teclado); leyenda que explica los cuatro tonos con palabras. | `src/components/NineBoxMatrix.tsx` (+ prueba) |
| 8 | Colores de gráficas | `src/lib/chartTheme.ts` lee los colores de `index.css` (variables `--color-chart-*` y `--color-funnel-*`). Cero hex a mano en componentes (salvo el logo); una prueba lo vigila. El bloque `@theme` pasó a `static` para que todas las variables de marca existan en el CSS. | Dashboard, Métricas, Login |
| 9 | Móvil | Tabla de Admin con scroll horizontal; tablero de Candidatos apilado en vertical en pantallas chicas. | `AdminPage.tsx`, `CandidatesPage.tsx` |
| 10 | Feedback de carga | `Button loading`: deshabilita, `aria-busy` y giro. Usado en Entrar ("Entrando…"), "Volver a los datos de ejemplo" ("Restableciendo…") y en los botones "Generar con IA" del wizard. | `primitives.tsx`, Login, Configuración, wizard |

Extras que salieron de las mismas reglas: cursor de mano en todo lo que se pulsa (Tailwind 4 lo quita por defecto), `aria-current="step"` en el paso activo del wizard, y las celdas vacías de la 9-Box ya no usan gris casi invisible.

### Qué NO se hizo y por qué

- **Esqueletos en el Dashboard**: no hacen falta; `DataReadyGate` muestra "Cargando datos de la empresa…" hasta tener todo, así que el Dashboard nunca se pinta a medias.
- **Foco atrapado en el tour guiado y en el menú lateral móvil**: el tour tiene su propia navegación por pasos; el menú se cierra con un toque fuera. Se dejaron como estaban.
- **Gris 400 en superficies oscuras** (menú lateral, cabeceras negras de Bienvenida y ayuda de módulo, botón de Ayuda): ahí el 400 contrasta mejor que el 500; no se tocó.

### Qué conviene mirar en vivo

Claude solo pudo abrir la **pantalla de acceso** en el navegador (las demás piden usuario y contraseña). Al entrar, vale la pena revisar: el Dashboard (embudo nuevo con porcentajes), Vacantes → Nueva vacante (pulsar "Siguiente" con el título vacío para ver el error junto al campo), la Matriz 9-Box (conteos y leyenda) y Configuración (agregar persona sin nombre).

## Lo que la skill confirma que ya estaba bien

- Estilo recomendado para "Job Board/Recruitment": **Flat + Minimalismo suizo**, tablero "HR Analytics" → es exactamente la línea actual (blanco, alto contraste, geométrico, sin sombras pesadas).
- **Sin modo oscuro** es correcto: la skill lo marca como antipatrón para este producto.
- Confirmaciones propias antes de borrar (`ConfirmDialog` con `role="alertdialog"`) ✓
- `prefers-reduced-motion` respetado y foco visible global en `index.css` ✓
- Iconos SVG (Lucide), transiciones de 150–300 ms ✓
- Menú con máximo 3 grupos y etiquetas claras ✓

## Lo que la skill propone y **no conviene** adoptar

| Propuesta de la skill | Por qué no |
|---|---|
| Paleta azul (`#2563EB`) con acento naranja | La marca de 4 colores (rojo-naranja, blanco, gris, negro) es decisión firme. |
| Tipografía Plus Jakarta Sans | Bricolage Grotesque + Instrument Sans + IBM Plex Mono ya están elegidas e instaladas. |
| Estilo Glassmorphism (vidrio esmerilado) | No aporta a una herramienta interna de RR.HH. y sube el riesgo de contraste. |
| Animaciones GSAP al hacer scroll | Es un panel de trabajo, no una página de ventas; la propia skill pide "motion sutil". |

Nota: la base de datos de la skill no tiene "RR.HH. / ATS" como tipo de producto (lo más cercano es "Job Board/Recruitment"), por eso su propuesta de colores es genérica. El generador de sistema de diseño sirve para proyectos nuevos; en Talentia Labs lo útil son las **reglas UX, las de gráficas y la lista de verificación**.

## Cómo usar la skill de ahora en adelante

- En cualquier proyecto, basta pedir: *"usa la skill `ui-ux-pro-max` para revisar/diseñar esta pantalla"*. Se activa sola cuando el pedido es de diseño de interfaz.
- Búsqueda directa de una regla (en PowerShell o Git Bash):

```powershell
python "$HOME/.claude/skills/ui-ux-pro-max/scripts/search.py" "error summary validation" --domain ux
```

- Dominios disponibles: `ux`, `style`, `color`, `typography`, `chart`, `icons`, `landing`, `product`, `gsap`, `react`, `google-fonts`; stacks: `--stack react`, `--stack html-tailwind`, etc.
- Cómo se instaló y cómo actualizarla: `~/.claude/skills/ui-ux-pro-max/INSTALADO.md`.
- Las tres pruebas "guardianas" (`typography.test.ts`, `chartTheme.test.ts`, `primitives.test.tsx`) hacen que `npm test` falle si alguien vuelve a meter texto menor de 12 px, un color hex a mano en un componente o un `title` en un Badge.
