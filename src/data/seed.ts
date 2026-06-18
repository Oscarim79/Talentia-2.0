import type {
  Plan,
  Tenant,
  User,
  Job,
  Candidate,
  NineBoxDataPoint,
  CultureDimension,
  UsageEvent,
} from '../types';
import { hashString } from '../lib/utils';

// ---------------- Planes ----------------
export const PLANS: Plan[] = [
  { id: 'plan_free', name: 'Free', tier: 'free', monthlyPriceUsd: 0, limits: { maxJobs: 1, maxCandidates: 25, screeningCredits: 25, interviewMinutes: 0, seats: 1 } },
  { id: 'plan_starter', name: 'Starter', tier: 'starter', monthlyPriceUsd: 49, limits: { maxJobs: 5, maxCandidates: 250, screeningCredits: 250, interviewMinutes: 120, seats: 3 } },
  { id: 'plan_growth', name: 'Growth', tier: 'growth', monthlyPriceUsd: 199, limits: { maxJobs: 25, maxCandidates: 2000, screeningCredits: 2000, interviewMinutes: 1000, seats: 10 } },
  { id: 'plan_scale', name: 'Scale', tier: 'scale', monthlyPriceUsd: 499, limits: { maxJobs: 100, maxCandidates: 10000, screeningCredits: 10000, interviewMinutes: 5000, seats: 50 } },
];

// ---------------- Tenants (empresas cliente) ----------------
export const TENANTS: Tenant[] = [
  { id: 't_americana', name: 'Americana 2000', slug: 'americana', logoEmoji: '🏬', industry: 'Retail · cadena multitienda (línea blanca, muebles, motos, tecnología)', planId: 'plan_growth', status: 'active', createdAt: '2026-01-12' },
  { id: 't_contacta', name: 'Contacta BPO', slug: 'contacta', logoEmoji: '🎧', industry: 'Call Center', planId: 'plan_starter', status: 'active', createdAt: '2026-03-04' },
  { id: 't_novapay', name: 'NovaPay', slug: 'novapay', logoEmoji: '💳', industry: 'Fintech', planId: 'plan_scale', status: 'trial', createdAt: '2026-05-20' },
];

export const USERS: User[] = [
  { id: 'u_oscar', tenantId: 't_americana', name: 'Oscar Morales', email: 'me@oscarimorales.com', role: 'owner' },
  { id: 'u_contacta', tenantId: 't_contacta', name: 'Lucía Reyes', email: 'lucia@contacta.gt', role: 'owner' },
  { id: 'u_nova', tenantId: 't_novapay', name: 'Diego Paz', email: 'diego@novapay.io', role: 'owner' },
];

// ---------------- Vacantes ----------------
export const JOBS: Job[] = [
  {
    id: 'job_motos', tenantId: 't_americana', title: 'Asesor de Ventas (Piso de tienda)',
    department: 'Ventas', location: 'Guatemala, GT', employmentType: 'Full-time', status: 'open',
    salaryMin: 4000, salaryMax: 6500, openings: 8, applySlug: 'americana/asesor-ventas', createdAt: '2026-06-01',
    description: 'Asesor comercial para sala de ventas de la tienda (electrodomésticos, muebles, motos y tecnología). Atención al cliente, cierre de ventas y seguimiento de crédito.',
    questions: [
      { id: 'q1', text: '¿Qué experiencia tienes en ventas de productos de alto valor?', source: 'ai', weight: 30, idealAnswer: 'Experiencia en ventas con metas y manejo de crédito.' },
      { id: 'q2', text: '¿Cómo manejas a un cliente indeciso?', source: 'manual', weight: 25 },
      { id: 'q3', text: '¿Tienes disponibilidad de horario rotativo y fines de semana?', source: 'manual', weight: 20 },
    ],
    filters: [
      { id: 'f1', polarity: 'positive', criterion: 'Ventas', weight: 35 },
      { id: 'f2', polarity: 'positive', criterion: 'Atención al cliente', weight: 25 },
      { id: 'f3', polarity: 'positive', criterion: 'Crédito', weight: 15 },
      { id: 'f4', polarity: 'negative', criterion: 'Sin disponibilidad de fines de semana', weight: 100 },
    ],
  },
  {
    id: 'job_cajero', tenantId: 't_americana', title: 'Cajero de Sucursal',
    department: 'Administración', location: 'Mixco, GT', employmentType: 'Full-time', status: 'open',
    salaryMin: 3500, salaryMax: 4200, openings: 2, applySlug: 'americana/cajero', createdAt: '2026-06-08',
    description: 'Manejo de caja, arqueos y atención al cliente en sucursal.',
    questions: [], filters: [{ id: 'f5', polarity: 'positive', criterion: 'Caja', weight: 50 }],
  },
  {
    id: 'job_agente', tenantId: 't_contacta', title: 'Agente de Call Center Bilingüe',
    department: 'Operaciones', location: 'Remoto', employmentType: 'Full-time', status: 'open',
    salaryMin: 5000, salaryMax: 7000, openings: 20, applySlug: 'contacta/agente-bilingue', createdAt: '2026-06-05',
    description: 'Atención telefónica inbound en inglés y español para cuenta de EE.UU.',
    questions: [], filters: [{ id: 'f6', polarity: 'positive', criterion: 'Inglés', weight: 60 }],
  },
];

// ---------------- Candidatos (foco: job_motos para la demo de screening) ----------------
function c(p: Partial<Candidate> & Pick<Candidate, 'id' | 'firstName' | 'lastName'>): Candidate {
  return {
    tenantId: 't_americana', jobId: 'job_motos', email: `${p.firstName?.toLowerCase()}@mail.com`,
    phone: '+502 5555 0000', source: 'LinkedIn', stage: 'screening', appliedAt: '2026-06-12',
    cvFileName: `${p.firstName}_${p.lastName}.pdf`, screeningStatus: 'scored', ...p,
  } as Candidate;
}

export const CANDIDATES: Candidate[] = [
  c({ id: 'cand_01', firstName: 'María', lastName: 'González', screeningScore: 94, matchPercent: 96, stage: 'interview',
    justification: 'Cumple 3/3 requisitos clave con 6 años en ventas de motos y manejo de crédito. Perfil fuerte, recomendado para entrevista.',
    parsed: { skills: ['Ventas', 'Crédito', 'Atención al cliente', 'CRM'], totalYears: 6, education: 'Diversificado', experience: [{ company: 'MultiMotos', role: 'Asesor de Ventas', years: 4 }] },
    evidence: [
      { criterion: 'Ventas', matched: true, quote: '"Asesor de Ventas en MultiMotos — 4 años"' },
      { criterion: 'Atención al cliente', matched: true, quote: '"Atención y seguimiento posventa de cartera"' },
      { criterion: 'Crédito', matched: true, quote: '"Gestión de crédito y cobranza"' },
    ] }),
  c({ id: 'cand_02', firstName: 'Carlos', lastName: 'Pérez', screeningScore: 88, matchPercent: 90,
    justification: 'Cumple 3/3 requisitos con 5 años de experiencia. Perfil fuerte, recomendado para entrevista.',
    parsed: { skills: ['Ventas', 'Negociación', 'Crédito'], totalYears: 5, education: 'Perito Contador', experience: [{ company: 'Distribuidora El Sol', role: 'Ejecutivo de Crédito', years: 3 }] },
    evidence: [
      { criterion: 'Ventas', matched: true, quote: '"Ejecutivo con metas mensuales cumplidas"' },
      { criterion: 'Atención al cliente', matched: true, quote: '"Manejo de cartera de 120 clientes"' },
      { criterion: 'Crédito', matched: true, quote: '"Ejecutivo de Crédito en Distribuidora El Sol — 3 años"' },
    ] }),
  c({ id: 'cand_03', firstName: 'Ana', lastName: 'López', screeningScore: 76, matchPercent: 80,
    justification: 'Cumple 2/3 requisitos con 4 años de experiencia. Perfil parcial, evaluar en entrevista.',
    parsed: { skills: ['Ventas', 'Atención al cliente'], totalYears: 4, education: 'Diversificado', experience: [{ company: 'Walmart GT', role: 'Asesor de Ventas', years: 4 }] },
    evidence: [
      { criterion: 'Ventas', matched: true, quote: '"Asesor de piso de ventas — 4 años"' },
      { criterion: 'Atención al cliente', matched: true, quote: '"Servicio al cliente en retail"' },
      { criterion: 'Crédito', matched: false, quote: '— sin evidencia en el CV —' },
    ] }),
  c({ id: 'cand_04', firstName: 'Jorge', lastName: 'Ramírez', screeningScore: 71, matchPercent: 72,
    justification: 'Cumple 2/3 requisitos con 3 años de experiencia. Perfil parcial, evaluar en entrevista.',
    parsed: { skills: ['Ventas', 'Caja'], totalYears: 3, education: 'Bachillerato', experience: [{ company: 'Tigo', role: 'Asesor de Ventas', years: 2 }] },
    evidence: [
      { criterion: 'Ventas', matched: true, quote: '"Asesor de Ventas en Tigo — 2 años"' },
      { criterion: 'Atención al cliente', matched: true, quote: '"Atención en punto de venta"' },
      { criterion: 'Crédito', matched: false, quote: '— sin evidencia en el CV —' },
    ] }),
  c({ id: 'cand_05', firstName: 'Lucía', lastName: 'Hernández', screeningScore: 63, matchPercent: 65, stage: 'applied',
    justification: 'Cumple 1/3 requisitos con 2 años de experiencia. Perfil parcial, evaluar en entrevista.',
    parsed: { skills: ['Atención al cliente', 'Caja'], totalYears: 2, education: 'Diversificado', experience: [{ company: 'Banco Industrial', role: 'Cajero', years: 2 }] },
    evidence: [
      { criterion: 'Ventas', matched: false, quote: '— sin evidencia en el CV —' },
      { criterion: 'Atención al cliente', matched: true, quote: '"Cajero con atención directa al público"' },
      { criterion: 'Crédito', matched: false, quote: '— sin evidencia en el CV —' },
    ] }),
  c({ id: 'cand_06', firstName: 'Pedro', lastName: 'Castillo', screeningScore: 41, matchPercent: 38, stage: 'rejected',
    flags: ['Posible criterio excluyente: Sin disponibilidad de fines de semana'],
    justification: 'Candidato con 3 años de experiencia, pero se detectó un criterio excluyente (no disponibilidad de fines de semana). Revisar antes de avanzar.',
    parsed: { skills: ['Logística', 'Inventarios'], totalYears: 3, education: 'Bachillerato', experience: [{ company: 'Walmart GT', role: 'Supervisor', years: 3 }] },
    evidence: [
      { criterion: 'Ventas', matched: false, quote: '— sin evidencia en el CV —' },
      { criterion: 'Atención al cliente', matched: false, quote: '— sin evidencia en el CV —' },
      { criterion: 'Crédito', matched: false, quote: '— sin evidencia en el CV —' },
    ] }),
  c({ id: 'cand_07', firstName: 'Sofía', lastName: 'Morales', screeningScore: 58, matchPercent: 60, stage: 'applied',
    justification: 'Cumple 1/3 requisitos con 5 años de experiencia en otra industria. Perfil parcial.',
    parsed: { skills: ['Seguros', 'Negociación'], totalYears: 5, education: 'Licenciatura', experience: [{ company: 'Seguros G&T', role: 'Ejecutivo de Crédito', years: 5 }] },
    evidence: [
      { criterion: 'Ventas', matched: true, quote: '"Venta consultiva de seguros — 5 años"' },
      { criterion: 'Atención al cliente', matched: false, quote: '— sin evidencia en el CV —' },
      { criterion: 'Crédito', matched: false, quote: '— sin evidencia en el CV —' },
    ] }),
  c({ id: 'cand_10', firstName: 'Andrea', lastName: 'Estrada', stage: 'hired', hiredAt: '2026-06-14', screeningScore: 91, matchPercent: 93,
    justification: 'Contratada: cumple 3/3 requisitos con 5 años en venta de motos y manejo de crédito.',
    parsed: { skills: ['Ventas', 'Crédito', 'CRM', 'Atención al cliente'], totalYears: 5, education: 'Diversificado', experience: [{ company: 'MultiMotos', role: 'Asesor de Ventas', years: 5 }] },
    evidence: [
      { criterion: 'Ventas', matched: true, quote: '"Asesor de Ventas en MultiMotos — 5 años"' },
      { criterion: 'Atención al cliente', matched: true, quote: '"Cartera de clientes con seguimiento posventa"' },
      { criterion: 'Crédito', matched: true, quote: '"Gestión de crédito y cobranza"' },
    ] }),
  c({ id: 'cand_11', firstName: 'Mario', lastName: 'Vélez', stage: 'offer', screeningScore: 85, matchPercent: 88,
    justification: 'En oferta: cumple 3/3 requisitos con 4 años de experiencia en ventas.',
    parsed: { skills: ['Ventas', 'Negociación', 'Atención al cliente'], totalYears: 4, education: 'Perito Contador', experience: [{ company: 'Tigo', role: 'Asesor de Ventas', years: 4 }] },
    evidence: [
      { criterion: 'Ventas', matched: true, quote: '"Asesor de Ventas en Tigo — 4 años"' },
      { criterion: 'Atención al cliente', matched: true, quote: '"Atención en punto de venta"' },
      { criterion: 'Crédito', matched: false, quote: '— sin evidencia en el CV —' },
    ] }),
  // --- Cola de errores (PDFs ilegibles) ---
  c({ id: 'cand_08', firstName: 'Roberto', lastName: 'Díaz', screeningStatus: 'error', errorReason: 'illegible_pdf', stage: 'applied', screeningScore: undefined, matchPercent: undefined, cvFileName: 'Roberto_Diaz_scan.pdf' }),
  c({ id: 'cand_09', firstName: 'Gabriela', lastName: 'Solís', screeningStatus: 'error', errorReason: 'password_protected', stage: 'applied', screeningScore: undefined, matchPercent: undefined, cvFileName: 'Gabriela_foto_cv.pdf' }),
];

// ---------------- Módulo Talento: 9-Box (la joya, datos demo) ----------------
const CULTURE_KEYS = [
  'clarity', 'inspiration', 'empowerment', 'integrity', 'feedback',
  'support', 'transparency', 'mentoring', 'emotional', 'conflict',
] as const;

// Jefe por departamento (para enviar la recomendación también al jefe vía WhatsApp).
const MANAGERS: Record<string, { name: string; phone: string }> = {
  'Ventas': { name: 'Ricardo Fuentes', phone: '+502 5512 0001' },
  'Crédito y Cobranza': { name: 'Patricia Gómez', phone: '+502 5512 0002' },
  'Atención al Cliente': { name: 'Sandra Ical', phone: '+502 5512 0003' },
  'Logística': { name: 'Marvin López', phone: '+502 5512 0004' },
  'Caja': { name: 'Luis Marroquín', phone: '+502 5512 0005' },
};

// Genera las 10 dimensiones 360° alrededor del score base (determinista, varía por persona).
function makeCultureScores(seed: string, base: number): Record<string, number> {
  const h = hashString(seed);
  const out: Record<string, number> = {};
  CULTURE_KEYS.forEach((k, i) => {
    const delta = (((h >> i) & 3) - 1.5) * 0.4; // -0.6 .. +0.6
    out[k] = Math.max(1, Math.min(5, Math.round((base + delta) * 10) / 10));
  });
  return out;
}

function person(p: {
  id: string; name: string; initials: string; department: string; role: string;
  performanceScore: number; cultureScore: number; quadrant: string; enps: number; phone: string;
}): NineBoxDataPoint {
  const mgr = MANAGERS[p.department];
  const first = p.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return {
    ...p,
    refinedPerformanceScore: p.performanceScore,
    refinedCultureScore: p.cultureScore,
    email: `${first}@americana.gt`,
    managerName: mgr.name,
    managerPhone: mgr.phone,
    cultureScores: makeCultureScores(p.id, p.cultureScore),
  };
}

export const NINE_BOX: NineBoxDataPoint[] = [
  person({ id: 'e1', name: 'María González', initials: 'MG', department: 'Ventas', role: 'Asesora de Ventas Senior', performanceScore: 4.6, cultureScore: 4.7, quadrant: 'Superestrella', enps: 92, phone: '+502 5500 1001' }),
  person({ id: 'e2', name: 'Carlos Pérez', initials: 'CP', department: 'Crédito y Cobranza', role: 'Ejecutivo de Crédito', performanceScore: 4.2, cultureScore: 3.6, quadrant: 'Estrella', enps: 70, phone: '+502 5500 1002' }),
  person({ id: 'e3', name: 'Ana López', initials: 'AL', department: 'Atención al Cliente', role: 'Agente de Servicio', performanceScore: 3.2, cultureScore: 4.3, quadrant: 'Futuro Líder', enps: 80, phone: '+502 5500 1003' }),
  person({ id: 'e4', name: 'Jorge Ramírez', initials: 'JR', department: 'Ventas', role: 'Asesor de Ventas', performanceScore: 3.4, cultureScore: 3.3, quadrant: 'Colaborador Clave', enps: 58, phone: '+502 5500 1004' }),
  person({ id: 'e5', name: 'Lucía Hernández', initials: 'LH', department: 'Atención al Cliente', role: 'Agente de Servicio', performanceScore: 2.6, cultureScore: 4.1, quadrant: 'Diamante en Bruto', enps: 74, phone: '+502 5500 1005' }),
  person({ id: 'e6', name: 'Pedro Castillo', initials: 'PC', department: 'Caja', role: 'Cajero', performanceScore: 1.8, cultureScore: 2.0, quadrant: 'Crítico o Inadecuado', enps: 22, phone: '+502 5500 1006' }),
  person({ id: 'e7', name: 'Sofía Morales', initials: 'SM', department: 'Ventas', role: 'Asesora de Ventas', performanceScore: 4.4, cultureScore: 2.7, quadrant: 'Profesional', enps: 44, phone: '+502 5500 1007' }),
  person({ id: 'e8', name: 'Luis Gómez', initials: 'LG', department: 'Logística', role: 'Encargado de Bodega', performanceScore: 2.9, cultureScore: 2.6, quadrant: 'Colaborador Inconsistente', enps: 40, phone: '+502 5500 1008' }),
  person({ id: 'e9', name: 'Elena Ruiz', initials: 'ER', department: 'Crédito y Cobranza', role: 'Gestora de Cobranza', performanceScore: 2.2, cultureScore: 2.9, quadrant: 'Buen Colaborador', enps: 50, phone: '+502 5500 1009' }),
];

// 10 dimensiones de la Encuesta 360° (la joya de cultura)
export const CULTURE_DIMENSIONS: CultureDimension[] = [
  { key: 'clarity', label: 'Claridad y alineación', group: 'Liderazgo', score: 4.3 },
  { key: 'inspiration', label: 'Inspiración al logro', group: 'Liderazgo', score: 3.9 },
  { key: 'empowerment', label: 'Empoderamiento', group: 'Liderazgo', score: 4.1 },
  { key: 'integrity', label: 'Integridad y coherencia', group: 'Liderazgo', score: 4.5 },
  { key: 'feedback', label: 'Calidad del feedback', group: 'Comunicación y Soporte', score: 3.6 },
  { key: 'support', label: 'Soporte y trabajo en equipo', group: 'Comunicación y Soporte', score: 4.2 },
  { key: 'transparency', label: 'Transparencia', group: 'Comunicación y Soporte', score: 3.8 },
  { key: 'mentoring', label: 'Mentoring / Coaching', group: 'Comunicación y Soporte', score: 4.0 },
  { key: 'emotional', label: 'Inteligencia emocional', group: 'Inteligencia Emocional', score: 4.4 },
  { key: 'conflict', label: 'Resolución de conflictos', group: 'Inteligencia Emocional', score: 3.7 },
];

// ---------------- Eventos de uso (métricas / créditos) ----------------
export const USAGE_EVENTS: UsageEvent[] = [
  { id: 'ue1', tenantId: 't_americana', type: 'screening', amount: 142, costUsd: 1.42, createdAt: '2026-06-14' },
  { id: 'ue2', tenantId: 't_americana', type: 'interview_min', amount: 86, costUsd: 7.74, createdAt: '2026-06-14' },
  { id: 'ue3', tenantId: 't_americana', type: 'whatsapp_msg', amount: 210, costUsd: 1.05, createdAt: '2026-06-13' },
  { id: 'ue4', tenantId: 't_americana', type: 'llm_tokens', amount: 480000, costUsd: 2.40, createdAt: '2026-06-13' },
];
