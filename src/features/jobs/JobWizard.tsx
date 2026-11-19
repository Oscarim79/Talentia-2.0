import { useRef, useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, Sparkles, Check, Plus, Trash2, Download, Briefcase, TriangleAlert,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { providers } from '../../core/providers';
import { Button, Badge } from '../../components/ui/primitives';
import { Field } from '../../components/ui/Field';
import { slugify, downloadTextFile, fmtMoney } from '../../lib/utils';
import { useEscape } from '../../lib/useEscape';
import { useDialogFocus } from '../../lib/dialogFocus';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { jobToLinkedInXml } from '../../lib/linkedin';
import { validateJobBasics, type JobBasicsField } from './jobValidation';
import type { Job, ScreeningFilter, InterviewQuestion } from '../../types';

const STEPS = ['Básicos', 'Descripción IA', 'Filtros de screening', 'Preguntas extra', 'Revisar'] as const;

// IDs únicos aunque se generen varios en el mismo milisegundo.
let uidCounter = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${++uidCounter}`;

const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-300';

const FIELD_LABEL: Record<JobBasicsField, string> = {
  title: 'Título del puesto',
  department: 'Departamento',
  salaryMax: 'Salario máximo',
};

/**
 * Wizard paso a paso para crear una vacante con IA + export XML LinkedIn.
 * Con `job` funciona en modo edición: precarga la vacante, deja saltar entre pasos y guarda con `onSave`.
 */
export default function JobWizard({
  onClose,
  onCreate,
  job: editing,
  onSave,
}: {
  onClose: () => void;
  onCreate?: (job: Job) => void;
  job?: Job;
  onSave?: (job: Job) => void;
}) {
  const { tenant } = useTenant();
  const isEdit = !!editing;
  const [step, setStep] = useState(0);

  // ---- Paso 1: básicos ----
  const [title, setTitle] = useState(editing?.title ?? '');
  const [brand, setBrand] = useState(editing?.brand ?? tenant.brands[0] ?? tenant.name);
  const [department, setDepartment] = useState(editing?.department ?? '');
  const [location, setLocation] = useState(editing?.location ?? 'Guatemala, GT');
  const [employmentType, setEmploymentType] = useState<Job['employmentType']>(editing?.employmentType ?? 'Full-time');
  const [openings, setOpenings] = useState(editing?.openings ?? 1);
  const [salaryMin, setSalaryMin] = useState(editing?.salaryMin ?? 4000);
  const [salaryMax, setSalaryMax] = useState(editing?.salaryMax ?? 6000);

  // ---- Paso 2: descripción ----
  const [description, setDescription] = useState(editing?.description ?? '');
  const [genDesc, setGenDesc] = useState(false);

  // ---- Paso 3: filtros ----
  const [filters, setFilters] = useState<ScreeningFilter[]>(editing?.filters ?? []);
  const [filterText, setFilterText] = useState('');
  const [filterPolarity, setFilterPolarity] = useState<'positive' | 'negative'>('positive');

  // ---- Paso 4: preguntas ----
  const [questions, setQuestions] = useState<InterviewQuestion[]>(editing?.questions ?? []);
  const [genQ, setGenQ] = useState(false);

  // ---- Validación del paso 1: los errores se muestran junto a cada campo tras intentar avanzar ----
  const errors = validateJobBasics({ title, department, salaryMin, salaryMax });
  const valid = Object.keys(errors).length === 0;
  const [attempted, setAttempted] = useState(false);
  const errorOf = (field: JobBasicsField) => (attempted ? errors[field] : undefined);
  const fieldRefs = {
    title: useRef<HTMLInputElement>(null),
    department: useRef<HTMLInputElement>(null),
    salaryMax: useRef<HTMLInputElement>(null),
  };
  const summaryRef = useRef<HTMLDivElement>(null);

  /** Muestra los errores del paso 1 y lleva el foco al resumen (o al campo pedido). */
  function reportErrors(focusField?: JobBasicsField) {
    setAttempted(true);
    setStep(0);
    setTimeout(() => (focusField ? fieldRefs[focusField].current : summaryRef.current)?.focus(), 0);
  }

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

  /** Agrega el criterio escrito. Devuelve la lista nueva (útil para no perder lo escrito al cambiar de paso). */
  function addFilter(): ScreeningFilter[] {
    const criterion = filterText.trim();
    if (!criterion) return filters;
    const next = [
      ...filters,
      { id: nextId('f'), polarity: filterPolarity, criterion, weight: filterPolarity === 'positive' ? 30 : 100 },
    ];
    setFilters(next);
    setFilterText('');
    return next;
  }

  /** Si dejaron un criterio escrito sin pulsar «Agregar», se agrega al avanzar en vez de perderlo. */
  function goTo(target: number) {
    // Para salir del paso 1 hacia adelante, los datos básicos deben estar bien.
    if (step === 0 && target > 0 && !valid) {
      reportErrors();
      return;
    }
    if (step === 2 && filterText.trim()) addFilter();
    setStep(target);
  }

  function buildJob(filtersOverride?: ScreeningFilter[]): Job {
    return {
      // En edición se conserva todo lo que el wizard no toca (estado, enlace de postulación, guía, fecha).
      ...editing,
      id: editing?.id ?? `job_${Date.now()}`,
      tenantId: editing?.tenantId ?? tenant.id,
      title: title.trim(),
      brand,
      department: department.trim(),
      location: location.trim(),
      employmentType,
      status: editing?.status ?? 'open',
      salaryMin,
      salaryMax,
      description: description.trim() || `Vacante de ${title} en ${department}.`,
      // El enlace no cambia al editar: ya pudo haberse publicado.
      applySlug: editing?.applySlug ?? `${tenant.slug}/${slugify(title)}`,
      openings,
      createdAt: editing?.createdAt ?? new Date().toISOString().slice(0, 10),
      questions: questions.filter((q) => q.text.trim()),
      filters: filtersOverride ?? filters,
    };
  }

  function exportXml() {
    const job = buildJob();
    downloadTextFile(`linkedin_${slugify(title) || 'vacante'}.xml`, jobToLinkedInXml(job, tenant), 'application/xml');
  }

  /** Guardar exige lo mismo que el paso 1 para no dejar la vacante rota. */
  function finish() {
    if (!valid) {
      reportErrors();
      return;
    }
    const job = buildJob(step === 2 && filterText.trim() ? addFilter() : undefined);
    if (isEdit) onSave?.(job);
    else onCreate?.(job);
    onClose();
  }

  // Evita perder el trabajo con un clic fuera del modal o Escape.
  const dirty = isEdit
    ? JSON.stringify(buildJob()) !== JSON.stringify(editing) || filterText.trim().length > 0
    : title.trim().length > 0 || description.trim().length > 0 || filters.length > 0 || questions.length > 0;
  const confirm = useConfirm();
  async function safeClose() {
    if (
      !dirty ||
      (await confirm(
        isEdit
          ? { title: 'Descartar los cambios', message: 'Se perderán los cambios que hiciste a esta vacante.', confirmLabel: 'Descartar', tone: 'danger' }
          : { title: 'Descartar la vacante', message: 'Se perderá la vacante en progreso y lo que ya escribiste.', confirmLabel: 'Descartar', tone: 'danger' },
      ))
    )
      onClose();
  }
  useEscape(safeClose);
  // El foco entra al wizard, no se escapa con Tab y vuelve al botón que lo abrió al cerrar.
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef);

  const shownErrors = attempted ? (Object.keys(errors) as JobBasicsField[]) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
      onClick={safeClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Editar vacante' : 'Nueva vacante'}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera + stepper */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-700">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">{isEdit ? 'Editar vacante' : 'Nueva vacante'}</h2>
                <p className="text-xs text-neutral-500">Paso {step + 1} de {STEPS.length} · {STEPS[step]}</p>
              </div>
            </div>
            <button type="button" onClick={safeClose} aria-label="Cerrar" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex gap-1.5">
            {STEPS.map((s, i) => {
              const bar = `h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-brand-600' : 'bg-neutral-200'}`;
              // Al editar se puede saltar directo al paso que se quiere corregir (si los datos básicos son válidos).
              return isEdit ? (
                <button
                  key={s}
                  type="button"
                  aria-label={`Ir al paso ${i + 1}: ${s}`}
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => goTo(i)}
                  className="group flex-1 py-1.5"
                >
                  <div className={`${bar} group-hover:bg-brand-400`} />
                </button>
              ) : (
                <div key={s} className={`${bar} flex-1`} />
              );
            })}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              {shownErrors.length > 0 && (
                <div
                  ref={summaryRef}
                  tabIndex={-1}
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Revisa {shownErrors.length === 1 ? 'este campo' : `estos ${shownErrors.length} campos`} antes de continuar:
                  </p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                    {shownErrors.map((f) => (
                      <li key={f}>
                        <button type="button" className="font-medium underline underline-offset-2 hover:text-red-950" onClick={() => reportErrors(f)}>
                          {FIELD_LABEL[f]}
                        </button>
                        : {errors[f]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <Field label="Título del puesto *" error={errorOf('title')} className="col-span-2">
                  <input ref={fieldRefs.title} className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Asesor de Ventas" />
                </Field>
                <Field label="Marca *">
                  <select className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)}>
                    {(tenant.brands.length ? tenant.brands : [tenant.name]).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Departamento *" error={errorOf('department')}>
                  <input ref={fieldRefs.department} className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ventas" />
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
                <Field label="Salario máximo (GTQ)" error={errorOf('salaryMax')}>
                  <input ref={fieldRefs.salaryMax} type="number" min={0} className={inputCls} value={salaryMax} onChange={(e) => setSalaryMax(Number(e.target.value))} />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-600">Genera la descripción con IA y edítala a tu gusto.</p>
                <Button variant="secondary" onClick={generateDescription} loading={genDesc}>
                  {!genDesc && <Sparkles className="h-4 w-4" />}
                  {genDesc ? 'Generando…' : description ? 'Regenerar' : 'Generar con IA'}
                </Button>
              </div>
              <Field label="Descripción de la vacante">
                <textarea
                  className={`${inputCls} min-h-[280px] leading-relaxed`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Pulsa «Generar con IA» o escribe la descripción aquí…"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Define los criterios que el motor de screening usará para puntuar CVs.
                Los <b className="text-green-700">positivos</b> suman; los <b className="text-red-600">negativos</b> son excluyentes.
              </p>
              {isEdit && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Los cambios aplican a los CVs que subas desde ahora. Los candidatos ya puntuados conservan su puntaje;
                  para evaluarlos con los filtros nuevos, vuelve a pasar sus CVs por Screening IA.
                </p>
              )}
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    aria-label="Tipo de criterio"
                    className="w-full shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:w-40"
                    value={filterPolarity}
                    onChange={(e) => setFilterPolarity(e.target.value as 'positive' | 'negative')}
                  >
                    <option value="positive">+ Positivo</option>
                    <option value="negative">− Negativo</option>
                  </select>
                  <textarea
                    aria-label="Criterio de screening"
                    rows={2}
                    className={`${inputCls} min-w-0 flex-1 resize-y py-2.5 text-base leading-snug`}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addFilter();
                      }
                    }}
                    placeholder="Ej. Ventas, Inglés, Edad entre 25 y 40 años, Sin disponibilidad de fines de semana…"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-neutral-500">Enter agrega el criterio · Shift+Enter hace salto de línea</p>
                  <Button onClick={addFilter} disabled={!filterText.trim()}>
                    <Plus className="h-4 w-4" /> Agregar
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.length === 0 && <p className="text-sm text-neutral-500">Aún no hay filtros. Agrega al menos uno para un mejor scoring.</p>}
                {filters.map((f) => (
                  <span
                    key={f.id}
                    className={`inline-flex max-w-full items-start gap-1.5 break-words rounded-2xl px-3 py-1 text-xs font-semibold ${
                      f.polarity === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span className="min-w-0 whitespace-pre-wrap break-words">{f.polarity === 'positive' ? '+' : '−'} {f.criterion}</span>
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => prev.filter((x) => x.id !== f.id))}
                      aria-label={`Quitar criterio: ${f.criterion}`}
                      className="mt-0.5 shrink-0 rounded hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
                    >
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
                <p className="text-sm text-neutral-600">Opcionales: preguntas extra para el entrevistador. La entrevista (con una persona o con el asistente de IA) siempre usa la guía de competencias de RR.HH.</p>
                <Button variant="secondary" onClick={generateQuestions} loading={genQ}>
                  {!genQ && <Sparkles className="h-4 w-4" />}
                  {genQ ? 'Generando…' : questions.length ? 'Regenerar' : 'Generar con IA'}
                </Button>
              </div>
              <div className="space-y-2">
                {questions.length === 0 && <p className="text-sm text-neutral-500">Sin preguntas todavía. Genera con IA o agrega manualmente.</p>}
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 rounded-lg border border-neutral-200 p-3">
                    <span className="mt-1.5 text-xs font-bold text-neutral-500">{i + 1}</span>
                    <textarea
                      aria-label={`Pregunta ${i + 1}`}
                      className="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-neutral-700 focus:outline-none"
                      value={q.text}
                      rows={1}
                      onChange={(e) => setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)))}
                    />
                    {q.source === 'ai' && <Badge variant="blue">IA</Badge>}
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                      aria-label={`Quitar pregunta ${i + 1}`}
                      className="mt-0.5 rounded-md p-1 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                    >
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
              <div className="rounded-xl border border-neutral-200 p-4">
                <h3 className="text-base font-bold text-neutral-900">{title || 'Sin título'}</h3>
                <p className="mt-1 text-xs text-neutral-500">{department} · {location} · {employmentType}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="stone">{fmtMoney(salaryMin, 'GTQ')}–{fmtMoney(salaryMax, 'GTQ')}</Badge>
                  <Badge variant="brand">{openings} plazas</Badge>
                  <Badge variant="green">{filters.filter((f) => f.polarity === 'positive').length} filtros +</Badge>
                  <Badge variant="red">{filters.filter((f) => f.polarity === 'negative').length} filtros −</Badge>
                  <Badge variant="blue">{questions.length} preguntas</Badge>
                </div>
                <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  talentialabs.app/{tenant.slug}/{slugify(title) || 'vacante'}
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
        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-6 py-4">
          <Button variant="ghost" onClick={() => (step === 0 ? safeClose() : goTo(step - 1))}>
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancelar' : 'Atrás'}
          </Button>
          {step < STEPS.length - 1 ? (
            <div className="flex items-center gap-2">
              {isEdit && (
                <Button variant="secondary" onClick={finish}>
                  <Check className="h-4 w-4" /> Guardar cambios
                </Button>
              )}
              <Button onClick={() => goTo(step + 1)}>
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={finish}>
              <Check className="h-4 w-4" /> {isEdit ? 'Guardar cambios' : 'Crear vacante'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
