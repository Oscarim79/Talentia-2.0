import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, AlertTriangle, Send, Compass, PlayCircle, MessageCircleQuestion, ClipboardList } from 'lucide-react';
import { Card, PageHeader, Badge } from '../../components/ui/primitives';
import { FEEDBACK_EMAIL } from '../../core/config';
import { useHelp } from './HelpContext';

/** Guion de la ronda de prueba para el equipo de RR.HH. (una semana). */
export const PILOT_DAYS: { day: string; title: string; goal: string; tasks: string[]; route?: string; routeLabel?: string }[] = [
  {
    day: 'Día 1',
    title: 'Conocer la herramienta',
    goal: 'Entender el orden del trabajo y dónde está cada cosa.',
    tasks: [
      'Mira el video de 3 minutos y medio (botón Ayuda → Video).',
      'Haz el tour guiado completo (botón Ayuda → Guía → Iniciar el tour).',
      'Recorre el menú por tu cuenta y hazle al chat de ayuda al menos 3 preguntas sobre lo que no entendiste.',
    ],
  },
  {
    day: 'Día 2',
    title: 'Crear una vacante',
    goal: 'Probar el asistente de 5 pasos con una plaza real de tu marca.',
    tasks: [
      'En Vacantes, crea una vacante real que tengas abierta hoy (por ejemplo, Jefe de Tienda para Abiq).',
      'Genera la descripción con IA y corrige lo que no diga como ustedes lo dirían.',
      'Escribe los filtros de screening que de verdad usarías para descartar o priorizar un CV.',
      'Descarga el XML de LinkedIn y revisa si le falta algún dato que hoy sí publican.',
    ],
    route: '/vacantes',
    routeLabel: 'Ir a Vacantes',
  },
  {
    day: 'Día 3',
    title: 'Screening de CVs',
    goal: 'Ver cómo la IA ordena los CVs y qué pasa con los ilegibles.',
    tasks: [
      'En Screening IA, elige Asesor de Ventas y pulsa "CVs de ejemplo" para ver el lote completo.',
      'Sube también archivos tuyos: en esta demo la IA solo lee el nombre del archivo, así que los puntajes serán de ejemplo; lo que importa es el flujo.',
      'Revisa la pestaña Errores y piensa: ¿qué harían hoy con un CV escaneado o con contraseña?',
      'Anota si la evidencia por requisito te serviría para decidir sin abrir el CV.',
    ],
    route: '/screening',
    routeLabel: 'Ir a Screening IA',
  },
  {
    day: 'Día 4',
    title: 'Responder y agendar entrevistas',
    goal: 'Probar el mensaje automático y la bandeja de envíos.',
    tasks: [
      'En Respuestas a CVs, filtra por score mínimo 75 y mira la vista previa del mensaje (ojito).',
      'Cambia la modalidad, el horario de cada candidato y la firma hasta que el mensaje sea el que ustedes mandarían de verdad. Anota el texto final.',
      'Responde a los seleccionados y observa la Bandeja de envíos: quién confirmó y quién no; reenvía a quien no contestó.',
      'Activa la regla automática con el umbral que te parezca sensato y decide si la usarían así.',
    ],
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    day: 'Día 5',
    title: 'Seguimiento, métricas y metas',
    goal: 'Definir las metas de servicio reales de Americana.',
    tasks: [
      'En Candidatos, revisa el tablero por etapas y di si falta alguna etapa o columna.',
      'En Métricas RR.HH., mira "Cada quien" y la lista de pendientes: ¿así medirían el trabajo del equipo?',
      'En Configuración, cambia las metas en días a lo que hoy es realista para ustedes (revisar, responder, entrevistar, decidir, cerrar).',
      'Envía tus preguntas y comentarios desde Configuración → Preguntas al chat de ayuda → "Enviar a Oscar".',
    ],
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
  },
];

export const PILOT_QUESTIONS = [
  '¿El orden Vacante → CVs → Respuestas → Candidatos → Métricas coincide con cómo trabajan hoy? ¿Qué paso falta o sobra?',
  '¿Qué datos de una vacante faltan en el asistente? (turno, tienda, jefe directo, fecha límite…)',
  '¿Qué datos de un candidato necesitan ver que hoy no aparecen?',
  '¿Cuál es el mensaje real que enviarían para agendar entrevista, y por qué canal (WhatsApp, correo, llamada)?',
  '¿Qué metas en días son realistas para revisar, responder, entrevistar, decidir y cerrar?',
  '¿Qué reporte le pide Reynaldo a Jessica cada semana y qué le pide gerencia a Reynaldo?',
  '¿Qué pregunta le hicieron al chat de ayuda que no supo responder?',
];

export const PILOT_RULES = [
  'Es una demostración: los datos son de ejemplo y la IA está simulada. Nada de lo que hagan afecta a ningún candidato real.',
  'Usa siempre el mismo navegador en la misma computadora: lo que hagas (vacantes creadas, CVs cargados, mensajes enviados, metas, equipo, módulos) y tus preguntas se guardan ahí.',
  'No hay usuarios ni contraseñas todavía; entra directo con el enlace.',
  'Si algo se rompe o quieres empezar de cero: Configuración → "Restablecer la demo".',
];

export default function PilotGuidePage() {
  const { startTour, openPanel } = useHelp();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Equipo de RR.HH."
        title="Ronda de prueba"
        subtitle="Una semana para probar TALENTIA con calma y decirnos qué le falta antes de conectarla a datos reales."
        actions={<Badge variant="gold"><CalendarDays className="h-3 w-3" /> 5 días · 20 min por día</Badge>}
      />

      <Card className="mb-6 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-700">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Antes de empezar
        </h2>
        <ul className="space-y-2 text-sm text-stone-600">
          {PILOT_RULES.map((r) => (
            <li key={r} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />{r}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => openPanel('video', { video: 'tour' })} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            <PlayCircle className="h-4 w-4" /> Ver el video (3½ min)
          </button>
          <button onClick={() => startTour()} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <Compass className="h-4 w-4" /> Iniciar el tour
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {PILOT_DAYS.map((d) => (
          <Card key={d.day} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-brand-600">{d.day}</p>
                <h3 className="font-display text-lg font-semibold text-ink">{d.title}</h3>
                <p className="mt-0.5 text-sm text-stone-500">{d.goal}</p>
              </div>
              {d.route && (
                <Link to={d.route} className="text-xs font-semibold text-brand-600 hover:underline">{d.routeLabel} →</Link>
              )}
            </div>
            <ol className="mt-4 space-y-2">
              {d.tasks.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm text-stone-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-700">
          <ClipboardList className="h-4 w-4 text-brand-600" /> Lo que queremos saber al final de la semana
        </h2>
        <ol className="space-y-2 text-sm text-stone-700">
          {PILOT_QUESTIONS.map((q, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">{i + 1}</span>
              {q}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-6 bg-brand-950 p-5 text-white">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Send className="h-4 w-4 text-gold-400" /> Cómo enviar tus comentarios</h2>
        <p className="mt-2 text-sm text-brand-100">
          Todo lo que le preguntes al chat de ayuda queda guardado. Al terminar la semana, ve a <Link to="/configuracion" className="font-semibold text-gold-300 hover:underline">Configuración → Preguntas al chat de ayuda</Link> y pulsa <b>"Enviar a Oscar"</b>: se abre un correo con tus preguntas listo para agregar tus respuestas a las 7 preguntas de arriba. También puedes escribir directo a <span className="font-mono text-gold-200">{FEEDBACK_EMAIL}</span>.
        </p>
        <button onClick={() => openPanel('chat')} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/20">
          <MessageCircleQuestion className="h-4 w-4" /> Abrir el chat de ayuda
        </button>
      </Card>
    </div>
  );
}
