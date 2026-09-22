import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Puzzle, Lock, ArrowUpRight, Timer, Users, Plus, Trash2, RotateCcw, MessageCircleQuestion, Send, Copy, Download, Eraser, ClipboardList } from 'lucide-react';
import { useHelp } from '../help/HelpContext';
import { FEEDBACK_EMAIL, TEAM_PILOT } from '../../core/config';
import { downloadTextFile } from '../../lib/utils';
import { useTenant } from '../../context/TenantContext';
import { useSettings } from '../../context/SettingsContext';
import { MODULES } from '../../core/modules';
import { DEFAULT_SLA, SLA_LABELS, type SlaGoals } from '../metrics/hrMetrics';
import { Card, PageHeader, Badge, Button } from '../../components/ui/primitives';
import { cn } from '../../lib/utils';

const inputCls =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function SettingsPage() {
  const { tenant } = useTenant();
  const { settings, isModuleEnabled, setModuleEnabled, setSla, hrTeam, addTeamMember, removeTeamMember } = useSettings();
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const { questions, clearQuestions } = useHelp();
  const [copied, setCopied] = useState(false);

  const questionsText = () => {
    const lines = questions
      .slice()
      .reverse()
      .map((q) => `${new Date(q.at).toLocaleString('es-GT')} · ${q.route} · ${q.answered ? 'respondida' : 'SIN RESPUESTA'}\n  ${q.question}`);
    return `Preguntas al chat de ayuda de TALENTIA — ${tenant.name}\n\n${lines.join('\n\n')}\n\nMis respuestas a las 7 preguntas de la ronda de prueba:\n1.\n2.\n3.\n4.\n5.\n6.\n7.\n`;
  };
  const mailto = () =>
    `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('TALENTIA — preguntas y comentarios de la ronda de prueba')}&body=${encodeURIComponent(questionsText())}`;
  async function copyQuestions() {
    try {
      await navigator.clipboard.writeText(questionsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      downloadTextFile('preguntas-talentia.txt', questionsText());
    }
  }
  function resetDemo() {
    if (!window.confirm('Se borrarán metas, equipo agregado, módulos, preguntas y el estado del tour en este navegador. ¿Restablecer la demo?')) return;
    try {
      localStorage.removeItem('talentia.settings.v1');
      localStorage.removeItem('talentia.help.v1');
    } catch {
      /* sin almacenamiento */
    }
    window.location.href = import.meta.env.BASE_URL;
  }
  const slaIsDefault = (Object.keys(DEFAULT_SLA) as (keyof SlaGoals)[]).every((k) => settings.sla[k] === DEFAULT_SLA[k]);

  function submitMember() {
    if (!newName.trim()) return;
    addTeamMember(newName, newTitle || 'Reclutador/a');
    setNewName('');
    setNewTitle('');
  }

  return (
    <div>
      <PageHeader
        eyebrow="Gestión"
        title="Configuración"
        subtitle={`Equipo de RR.HH., metas de servicio y módulos opcionales de ${tenant.name}.`}
      />

      {/* Equipo de RR.HH. */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-100 px-6 py-4">
          <Users className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-stone-700">Equipo de RR.HH.</h2>
          <span className="ml-auto text-xs text-stone-400">Las personas que aparecen en "Cada quien" de Métricas</span>
        </div>
        <ul className="divide-y divide-stone-100">
          {hrTeam.map((u) => {
            const added = settings.team.some((m) => m.id === u.id);
            return (
              <li key={u.id} className="flex items-center gap-3 px-6 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                  {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800">{u.name}</p>
                  <p className="text-xs text-stone-500">{u.title ?? (u.role === 'admin' ? 'Jefe de RR.HH.' : 'Reclutador/a')}{u.email ? ` · ${u.email}` : ''}</p>
                </div>
                {added ? (
                  <button onClick={() => removeTeamMember(u.id)} aria-label={`Quitar a ${u.name}`} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <Badge variant="stone">Base</Badge>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap items-end gap-2 border-t border-stone-100 bg-stone-50/60 px-6 py-4">
          <label className="min-w-[200px] flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-400">Nombre</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitMember()} placeholder="Nombre y apellido" className={inputCls} />
          </label>
          <label className="min-w-[180px] flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-400">Cargo</span>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitMember()} placeholder="Reclutador/a" className={inputCls} />
          </label>
          <Button onClick={submitMember} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </Card>

      {/* Metas de servicio */}
      <Card className="mb-6 overflow-hidden" dataTour="settings:goals">
        <div className="flex items-center gap-2 border-b border-stone-100 px-6 py-4">
          <Timer className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-stone-700">Metas de servicio (días)</h2>
          <span className="ml-auto flex items-center gap-2">
            {!slaIsDefault && <Badge variant="gold">Personalizadas</Badge>}
            <Button variant="ghost" onClick={() => setSla({ ...DEFAULT_SLA })} disabled={slaIsDefault}>
              <RotateCcw className="h-4 w-4" /> Restablecer
            </Button>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(SLA_LABELS) as (keyof SlaGoals)[]).map((k) => (
            <label key={k} className="block">
              <span className="block text-sm font-semibold text-stone-800">{SLA_LABELS[k].label}</span>
              <span className="mb-2 block text-[11px] text-stone-400">{SLA_LABELS[k].help}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.sla[k]}
                  onChange={(e) => setSla({ ...settings.sla, [k]: Math.max(1, Math.min(60, Math.round(Number(e.target.value) || 1))) })}
                  aria-label={`Meta: ${SLA_LABELS[k].label}`}
                  className={cn(inputCls, 'w-20')}
                />
                <span className="text-xs text-stone-500">días</span>
              </div>
            </label>
          ))}
        </div>
        <p className="border-t border-stone-100 px-6 py-3 text-[11px] text-stone-400">
          Las metas definen el semáforo y los "pendientes fuera de meta" en Métricas RR.HH. y en el Dashboard. Se aplican al instante.
        </p>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-100 px-6 py-4">
          <Puzzle className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-stone-700">Módulos opcionales</h2>
        </div>
        <ul className="divide-y divide-stone-100">
          {MODULES.map((m) => {
            const on = isModuleEnabled(m.id);
            return (
              <li key={m.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-stone-800">{m.name}</p>
                    <Badge variant={on ? 'green' : 'stone'}>{on ? 'Activo' : 'Desactivado'}</Badge>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-stone-500">{m.description}</p>
                  <p className="mt-2 text-xs text-stone-400">Al activarlo: {m.unlocks}</p>
                  {on && (
                    <Link
                      to={m.route}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Abrir {m.name} <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <Toggle checked={on} onChange={(v) => setModuleEnabled(m.id, v)} label={`Activar ${m.name}`} />
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Preguntas al chat de ayuda */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-6 py-4">
          <MessageCircleQuestion className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-stone-700">Preguntas al chat de ayuda</h2>
          <Badge variant={questions.some((q) => !q.answered) ? 'amber' : 'stone'}>
            {questions.length} · {questions.filter((q) => !q.answered).length} sin respuesta
          </Badge>
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <a
              href={mailto()}
              className={cn('inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700', questions.length === 0 && 'pointer-events-none opacity-40')}
            >
              <Send className="h-4 w-4" /> Enviar a Oscar
            </a>
            <Button variant="secondary" onClick={copyQuestions} disabled={questions.length === 0}>
              <Copy className="h-4 w-4" /> {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button variant="secondary" onClick={() => downloadTextFile('preguntas-talentia.txt', questionsText())} disabled={questions.length === 0}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={clearQuestions} disabled={questions.length === 0}>
              <Eraser className="h-4 w-4" /> Borrar
            </Button>
          </span>
        </div>
        {questions.length === 0 ? (
          <p className="px-6 py-6 text-sm text-stone-400">Aún no has hecho preguntas. Todo lo que preguntes en el botón Ayuda aparecerá aquí para mejorar la guía.</p>
        ) : (
          <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto">
            {questions.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 px-6 py-2.5 text-sm">
                <Badge variant={q.answered ? 'green' : 'red'}>{q.answered ? 'Respondida' : 'Sin respuesta'}</Badge>
                <span className="text-stone-800">{q.question}</span>
                <span className="ml-auto text-[11px] text-stone-400">{q.route} · {new Date(q.at).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        )}
        {TEAM_PILOT && (
          <p className="border-t border-stone-100 px-6 py-3 text-[11px] text-stone-400">
            Al terminar la ronda de prueba, "Enviar a Oscar" abre un correo con estas preguntas y espacio para tus respuestas.{' '}
            <Link to="/ronda-de-prueba" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"><ClipboardList className="h-3 w-3" /> Ver el guion</Link>
          </p>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-stone-100 p-2 text-stone-500">
            <Lock className="h-4 w-4" />
          </div>
          <div className="text-sm text-stone-600">
            <p className="font-semibold text-stone-800">Software opinado</p>
            <p className="mt-1 text-stone-500">
              TALENTIA no tiene pantallas de configuración flexible: el proceso de reclutamiento ya viene
              definido y la empresa se adapta a él. Los datos entran por plantillas estándar (Colaboradores,
              KPIs de Desempeño y Cultura 360°). Aquí solo se decide quién está en el equipo, qué tan rápido
              debe atender cada etapa y qué módulos opcionales están encendidos.
            </p>
            <Button variant="ghost" className="mt-3 text-red-700 hover:bg-red-50" onClick={resetDemo}>
              <RotateCcw className="h-4 w-4" /> Restablecer la demo en este navegador
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        checked ? 'bg-brand-600' : 'bg-stone-300',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
