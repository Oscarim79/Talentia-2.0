// ============================================================
//  Evaluaciones de entrevista por competencias de ejemplo (demo).
//  Corresponden a candidatos que ya pasaron por entrevista en el seed:
//  contratados, en oferta y un descartado. María González (Asesor) y
//  Byron Tzul (Jefe) quedan sin evaluar para probar el flujo completo;
//  Fernanda Ruiz tiene la entrevista a medias (notas sin puntuar).
// ============================================================
import type { ChoiceLetter, CompetencyKey, GuideRole, InterviewEvaluation } from '../core/interviewGuide';

interface SeedInput {
  candidateId: string;
  jobId: string;
  role: GuideRole;
  interviewerId: string;
  date: string;
  status?: InterviewEvaluation['status'];
  /** Puntajes de las conductuales en orden (V1…V10 o J1…J12). */
  behavioral?: number[];
  /** Preguntas donde habló solo en plural (tope de 3). */
  plural?: string[];
  /** Criterios de la historia: cliente, comunicación, problemas, resultados. */
  story?: [number, number, number, number];
  /** Letras elegidas en opción múltiple, en orden (M1…). */
  choices?: string;
  notes?: Record<string, string>;
  observations?: Partial<Record<CompetencyKey, string>>;
}

const STORY_KEYS: CompetencyKey[] = ['cliente', 'comunicacion', 'problemas', 'resultados'];

function ev(p: SeedInput): InterviewEvaluation {
  const prefix = p.role === 'jefe' ? 'J' : 'V';
  return {
    candidateId: p.candidateId,
    tenantId: 't_americana',
    jobId: p.jobId,
    role: p.role,
    interviewerId: p.interviewerId,
    date: p.date,
    status: p.status ?? 'done',
    notes: p.notes ?? {},
    behavioral: Object.fromEntries((p.behavioral ?? []).map((s, i) => [`${prefix}${i + 1}`, s])),
    pluralOnly: Object.fromEntries((p.plural ?? []).map((id) => [id, true])),
    storyVariant: 'main',
    story: p.story ? Object.fromEntries(STORY_KEYS.map((k, i) => [k, p.story![i]])) : {},
    choices: Object.fromEntries([...(p.choices ?? '')].map((l, i) => [`M${i + 1}`, l as ChoiceLetter])),
    observations: p.observations ?? {},
    updatedAt: `${p.date}T18:00:00.000Z`,
  };
}

export const SEED_EVALUATIONS: InterviewEvaluation[] = [
  // ---------- Asesor de Ventas (guía de Vendedor) ----------
  ev({
    candidateId: 'cand_10', jobId: 'job_motos', role: 'vendedor', interviewerId: 'u_jessica', date: '2026-06-05',
    behavioral: [5, 4, 4, 5, 4, 4, 4, 5, 5, 4], story: [5, 4, 4, 5], choices: 'BCBAC',
    notes: {
      V1: '"Le pregunté para qué usaría la moto y le ofrecí dos opciones de crédito; regresó a comprar el casco."',
      V9: '"Cerré el trimestre al 118 % de mi meta personal."',
      story: 'Buscaba refrigeradora para negocio; le preguntó volumen y horario, ofreció modelo comercial. Venta + garantía extendida.',
    },
    observations: {
      cliente: 'Escucha antes de ofrecer y da seguimiento posventa por iniciativa propia.',
      comunicacion: 'Explica crédito y garantías con palabras sencillas; confirma que el cliente entendió.',
      equipo: 'Apoya a compañeros nuevos con el sistema de crédito.',
      problemas: 'Prioriza al cliente en hora pico y pide apoyo a tiempo.',
      resultados: 'Da cifras propias: 118 % de su meta en el trimestre.',
    },
  }),
  ev({
    candidateId: 'cand_11', jobId: 'job_motos', role: 'vendedor', interviewerId: 'u_reynaldo', date: '2026-06-10',
    behavioral: [4, 4, 4, 5, 3, 3, 4, 4, 5, 4], plural: ['V5'], story: [4, 4, 4, 4], choices: 'CCAAC',
    notes: {
      V4: '"Le pregunté qué le preocupaba: era la cuota. Le armé un plan a 18 meses."',
      V5: '"Hicimos la feria de motos y vendimos todo" — no supo decir qué hizo él.',
    },
    observations: {
      cliente: 'Atiende bien, pero ante una queja tiende a pasar el caso al encargado.',
      comunicacion: 'Muy buen manejo del cliente indeciso: pregunta antes de recomendar.',
      equipo: 'Habla del equipo en plural; su aporte personal no quedó claro.',
      problemas: 'Ordena prioridades con criterio y cumple.',
      resultados: 'Metas cumplidas en Tigo con cifras concretas.',
    },
  }),

  // ---------- Jefe de Tienda (guía de Jefe de Tienda) ----------
  ev({
    candidateId: 'cand_20', jobId: 'job_jefe', role: 'jefe', interviewerId: 'u_reynaldo', date: '2026-06-11',
    behavioral: [5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5, 4], story: [4, 4, 5, 4], choices: 'BCBACB',
    notes: {
      J7: '"Las diferencias de inventario venían de recepciones sin conteo; puse doble firma y bajaron 70 %."',
      J10: '"Íbamos al 60 % a mitad de mes; revisamos por vendedor cada mañana y cerramos en 103 %."',
      J11: '"Repartí la tienda por zonas, cada quien con su meta, y al cierre reconocí a cada uno."',
    },
    observations: {
      cliente: 'Mide la satisfacción con quejas y clientes recurrentes; corrige el proceso.',
      comunicacion: 'Comunica cambios explicando el porqué y confirma que se entendió.',
      equipo: 'Coordina con bodega central y otras tiendas sin esperar a que se lo pidan.',
      problemas: 'Busca la causa raíz (inventario) y la corrige con un proceso.',
      resultados: 'Recuperó la meta con seguimiento diario por vendedor.',
      liderazgo: 'Asigna responsabilidades claras, da seguimiento y reconoce el esfuerzo.',
    },
  }),
  ev({
    candidateId: 'cand_21', jobId: 'job_jefe', role: 'jefe', interviewerId: 'u_reynaldo', date: '2026-06-13',
    behavioral: [4, 4, 3, 4, 4, 3, 4, 3, 5, 4, 3, 4], story: [4, 3, 4, 4], choices: 'BBACCB',
    notes: {
      J3: 'Comunicó el cambio de horario "por WhatsApp al grupo"; no confirmó que se entendiera.',
      J9: '"Puse exhibición de línea blanca en la entrada en Hot Sale: +22 % en la categoría."',
    },
    observations: {
      cliente: 'Resuelve quejas sin desautorizar al vendedor.',
      comunicacion: 'Le falta confirmar que el equipo entendió los cambios; tiende a comunicar solo por escrito.',
      equipo: 'Colabora con otras tiendas, aunque se adapta lento a cambios de proceso.',
      problemas: 'Detecta problemas de inventario; delega poco.',
      resultados: 'Detecta oportunidades con datos y da cifras del resultado.',
      liderazgo: 'Capacita bien a los nuevos; le falta dar seguimiento al equipo en desafíos.',
    },
  }),
  ev({
    candidateId: 'cand_31', jobId: 'job_jefe', role: 'jefe', interviewerId: 'u_reynaldo', date: '2026-06-16',
    behavioral: [4, 3, 3, 4, 3, 3, 4, 3, 5, 4, 2, 2], plural: ['J11'], story: [4, 4, 4, 4], choices: 'CCAACA',
    notes: {
      J9: '"Yo solo vendí 40 motos en diciembre."',
      J11: '"Hicimos un buen trabajo todos juntos" — no describe qué hizo él como jefe.',
      J12: '"Que vea cómo lo hago yo y aprende." Sin plan ni verificación.',
    },
    observations: {
      cliente: 'Buen trato al cliente, pero no cambia el proceso después de una queja.',
      comunicacion: 'Se explica con claridad con clientes y proveedores.',
      equipo: 'Prioriza su tienda sobre la coordinación con otras áreas.',
      problemas: 'Resuelve lo inmediato; no siempre busca la causa.',
      resultados: 'Vendedor muy fuerte, con cifras propias.',
      liderazgo: 'No describe cómo dirige ni capacita: aprendizaje "viéndolo a él". Llamaría la atención en público.',
    },
  }),
  ev({
    candidateId: 'cand_22', jobId: 'job_jefe', role: 'jefe', interviewerId: 'u_reynaldo', date: '2026-06-17', status: 'draft',
    notes: {
      J1: '"Puse una encuesta de 3 preguntas en caja; las quejas por tiempo de espera bajaron."',
      J2: 'Atendió la queja ella misma, después habló con el vendedor en privado y repasaron la política de cambios.',
      J3: '"Reuní al equipo antes de abrir, expliqué por qué cambiaba el horario y pregunté dudas."',
    },
  }),
];
