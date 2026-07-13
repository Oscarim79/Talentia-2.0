import { useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, Sparkles, Loader2, Check, Plus, Trash2, Download, Briefcase,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { providers } from '../../core/providers';
import { Button, Badge } from '../../components/ui/primitives';
import { slugify, downloadTextFile, fmtMoney } from '../../lib/utils';
import { useEscape } from '../../lib/useEscape';
import { jobToLinkedInXml } from '../../lib/linkedin';
import type { Job, ScreeningFilter, InterviewQuestion } from '../../types';

const STEPS = ['Básicos', 'Descripción IA', 'Filtros de screening', 'Preguntas IA', 'Revisar'] as const;

// IDs únicos aunque se generen varios en el mismo milisegundo.
let uidCounter = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${++uidCounter}`;

const inputCls =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500';

/** Wizard paso a paso para crear una vacante con IA + export XML LinkedIn. */
export default function JobWizard({ onClose, onCreate }: { onClose: () => void; onCreate: (job: Job) => void }) {
  const { tenant } = useTenant();
  const [step, setStep] = useState(0);

  // ---- Paso 1: básicos ----
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('Guatemala, GT');
  const [employmentType, setEmploymentType] = useState<Job['employmentType']>('Full-time');
  const [openings, setOpenings] = useState(1);
  const [salaryMin, setSalaryMin] = useState(4000);
  const [salaryMax, setSalaryMax] = useState(6000);

  // ---- Paso 2: descripción ----
  const [description, setDescription] = useState('');
  const [genDesc, setGenDesc] = useState(false);

  // ---- Paso 3: filtros ----
  const [filters, setFilters] = useState<ScreeningFilter[]>([]);
  const [filterText, setFilterText] = useState('');
  const [filterPolarity, setFilterPolarity] = useState<'positive' | 'negative'>('positive');

  // ---- Paso 4: preguntas ----
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [genQ, setGenQ] = useState(false);

  const salaryInvalid = salaryMin > salaryMax;
  const canNext =
    step === 0
      ? title.trim().length > 1 && department.trim().length > 1 && !salaryInvalid
      : true;

  async function generateDescription() {
    setGenDesc(true);
    const text = await providers.llm.generateJobDescription({ title, department, seniority: 'Mid' });
    setDescription(text);
    setGenDesc(false);
  }

  async function generateQuestions() {
    setGenQ(true);
    const qs = await providers.llm.generateInterviewQuestions({ title, count: 5 });
    setQuestions(
      qs.map((text) => ({ id: nextId('q'), text, source: 'ai', weight: 20 })),
    );
    setGenQ(false);
  }

  function addFilter() {
    const criterion = filterText.trim();
    if (!criterion) return;
    setFilters((prev) => [
      ...prev,
      { id: nextId('f'), polarity: filterPolarity, criterion, weight: filterPolarity === 'positive' ? 30 : 100 },
    ]);
    setFilterText('');
  }

  function buildJob(): Job {
    return {
      id: `job_${Date.now()}`,
      tenantId: tenant.id,
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      employmentType,
      status: 'open',
      salaryMin,
      salaryMax,
      description: description.trim() || `Vacante de ${title} en ${department}.`,
      applySlug: `${tenant.slug}/${slugify(title)}`,
      openings,
      createdAt: new Date().toISOString().slice(0, 10),
      questions,
      filters,
    };
  }

  function exportXml() {
    const job = buildJob();
    downloadTextFile(`linkedin_${slugify(title) || 'vacante'}.xml`, jobToLinkedInXml(job, tenant), 'application/xml');
  }

  function finish() {
    onCreate(buildJob());
    onClose();
  }

  // Evita perder el trabajo con un clic fuera del modal o Escape.
  const dirty =
    title.trim().length > 0 || description.trim().length > 0 || filters.length > 0 || questions.length > 0;
  function safeClose() {
    if (!dirty || window.confirm('¿Descartar la vacante en progreso?')) onClose();
  }
  useEscape(safeClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nueva vacante"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      onClick={safeClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera + stepper */}
        <div className="border-b border-stone-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Nueva vacante</h2>
                <p className="text-xs text-stone-500">Paso {step + 1} de {STEPS.length} · {STEPS[step]}</p>
              </div>
            </div>
            <button onClick={safeClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-600' : 'bg-stone-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Título del puesto *">
                <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Asesor de Ventas - Motocicletas" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Departamento *">
                  <input className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ventas" />
                </Field>
                <Field label="Ubicación">
                  <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de empleo">
                  <select className={inputCls} value={employmentType} onChange={(e) => setEmploymentType(e.target.value as Job['employmentType'])}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </Field>
                <Field label="Plazas">
                  <input type="number" min={1} className={inputCls} value={openings} onChange={(e) => setOpenings(Math.max(1, Number(e.target.value)))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Salario mínimo (GTQ)">
                  <input type="number" min={0} className={inputCls} value={salaryMin} onChange={(e) => setSalaryMin(Number(e.target.value))} />
                </Field>
                <Field label="Salario máximo (GTQ)">
                  <input type="number" min={0} className={inputCls} value={salaryMax} onChange={(e) => setSalaryMax(Number(e.target.value))} />
                </Field>
              </div>
              {salaryInvalid && (
                <p className="text-xs font-medium text-red-600">
                  El salario mínimo no puede ser mayor que el máximo.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-600">Genera la descripción con IA y edítala a tu gusto.</p>
                <Button variant="secondary" onClick={generateDescription} disabled={genDesc}>
                  {genDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {genDesc ? 'Generando…' : description ? 'Regenerar' : 'Generar con IA'}
                </Button>
              </div>
              <textarea
                className={`${inputCls} min-h-[280px] leading-relaxed`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pulsa «Generar con IA» o escribe la descripción aquí…"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                Define los criterios que el motor de screening usará para puntuar CVs.
                Los <b className="text-green-700">positivos</b> suman; los <b className="text-red-600">negativos</b> son excluyentes.
              </p>
              <div className="flex gap-2">
                <select className={`${inputCls} w-36 shrink-0`} value={filterPolarity} onChange={(e) => setFilterPolarity(e.target.value as 'positive' | 'negative')}>
                  <option value="positive">+ Positivo</option>
                  <option value="negative">− Negativo</option>
                </select>
                <input
                  className={inputCls}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                  placeholder="Ej. Ventas, Inglés, Sin disponibilidad de fines de semana…"
                />
                <Button onClick={addFilter} disabled={!filterText.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.length === 0 && <p className="text-sm text-stone-400">Aún no hay filtros. Agrega al menos uno para un mejor scoring.</p>}
                {filters.map((f) => (
                  <span
                    key={f.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      f.polarity === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {f.polarity === 'positive' ? '+' : '−'} {f.criterion}
                    <button onClick={() => setFilters((prev) => prev.filter((x) => x.id !== f.id))} className="hover:opacity-60">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-600">Preguntas para la entrevista (manuales o generadas por IA).</p>
                <Button variant="secondary" onClick={generateQuestions} disabled={genQ}>
                  {genQ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {genQ ? 'Generando…' : questions.length ? 'Regenerar' : 'Generar con IA'}
                </Button>
              </div>
              <div className="space-y-2">
                {questions.length === 0 && <p className="text-sm text-stone-400">Sin preguntas todavía. Genera con IA o agrega manualmente.</p>}
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 rounded-lg border border-stone-200 p-3">
                    <span className="mt-1.5 text-xs font-bold text-stone-300">{i + 1}</span>
                    <textarea
                      className="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-stone-700 focus:outline-none"
                      value={q.text}
                      rows={1}
                      onChange={(e) => setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)))}
                    />
                    {q.source === 'ai' && <Badge variant="blue">IA</Badge>}
                    <button onClick={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))} className="mt-1 text-stone-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setQuestions((prev) => [...prev, { id: nextId('q'), text: '', source: 'manual', weight: 20 }])}
              >
                <Plus className="h-4 w-4" /> Agregar pregunta manual
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 p-4">
                <h3 className="text-base font-bold text-stone-900">{title || 'Sin título'}</h3>
                <p className="mt-1 text-xs text-stone-500">{department} · {location} · {employmentType}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="stone">{fmtMoney(salaryMin, 'GTQ')}–{fmtMoney(salaryMax, 'GTQ')}</Badge>
                  <Badge variant="brand">{openings} plazas</Badge>
                  <Badge variant="green">{filters.filter((f) => f.polarity === 'positive').length} filtros +</Badge>
                  <Badge variant="red">{filters.filter((f) => f.polarity === 'negative').length} filtros −</Badge>
                  <Badge variant="blue">{questions.length} preguntas</Badge>
                </div>
                <div className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
                  talentia.app/{tenant.slug}/{slugify(title) || 'vacante'}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Exportar a LinkedIn</p>
                  <p className="text-xs text-brand-700">Descarga el XML compatible con el feed de Job Postings de LinkedIn.</p>
                </div>
                <Button variant="secondary" onClick={exportXml} disabled={!title.trim()}>
                  <Download className="h-4 w-4" /> XML LinkedIn
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pie: navegación */}
        <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4">
          <Button variant="ghost" onClick={() => (step === 0 ? safeClose() : setStep((s) => s - 1))}>
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancelar' : 'Atrás'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!title.trim()}>
              <Check className="h-4 w-4" /> Crear vacante
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
    </label>
  );
}
