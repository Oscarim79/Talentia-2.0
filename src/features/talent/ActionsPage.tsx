import { useMemo, useState } from 'react';
import { AlertTriangle, Award, Eye, ClipboardCheck, RotateCcw, FileText, Send } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { NINE_BOX } from '../../data/seed';
import { Card, PageHeader, Badge, Button, StatCard } from '../../components/ui/primitives';
import type { NineBoxDataPoint } from '../../types';
import {
  deriveDecision,
  periodLight,
  LIGHT_META,
  bucketOf,
  type Decision,
  type DecisionTone,
} from './talentDecisions';
import { PersonProfileModal } from './PersonProfileModal';
import { ManagerReportModal } from './ManagerReportModal';

const TONE_BADGE: Record<DecisionTone, 'green' | 'amber' | 'red'> = {
  positive: 'green',
  neutral: 'amber',
  negative: 'red',
  critical: 'red',
};

interface ActionItem {
  person: NineBoxDataPoint;
  decision: Decision;
}

interface ReportCard {
  department: string;
  manager: string;
  reward: number;
  followup: number;
  risk: number;
}

const BUCKETS: { key: string; title: string; tones: DecisionTone[]; icon: typeof Award; accent: string }[] = [
  { key: 'urgent', title: 'Atención / riesgo', tones: ['critical', 'negative'], icon: AlertTriangle, accent: 'text-red-600' },
  { key: 'reward', title: 'Reconocer / premiar', tones: ['positive'], icon: Award, accent: 'text-green-600' },
  { key: 'followup', title: 'Seguimiento', tones: ['neutral'], icon: Eye, accent: 'text-amber-600' },
];

export default function ActionsPage() {
  const { tenant } = useTenant();
  const hasData = tenant.id === 't_americana';

  const [dept, setDept] = useState('Todos');
  const [done, setDone] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportDept, setReportDept] = useState<string | null>(null);

  const departments = useMemo(
    () => ['Todos', ...Array.from(new Set(NINE_BOX.map((p) => p.department))).sort()],
    [],
  );

  const items: ActionItem[] = useMemo(() => {
    const people = dept === 'Todos' ? NINE_BOX : NINE_BOX.filter((p) => p.department === dept);
    return people.map((person) => ({ person, decision: deriveDecision(person.history) }));
  }, [dept]);

  const selected = NINE_BOX.find((p) => p.id === selectedId) ?? null;

  // Un reporte por gerente/departamento (respeta el filtro de departamento).
  const reportCards = useMemo<ReportCard[]>(() => {
    const m = new Map<string, ReportCard>();
    items.forEach(({ person, decision }) => {
      const c = m.get(person.department) ?? { department: person.department, manager: person.managerName, reward: 0, followup: 0, risk: 0 };
      c[bucketOf(decision.tone)] += 1;
      m.set(person.department, c);
    });
    return Array.from(m.values()).sort((a, b) => b.risk - a.risk || a.department.localeCompare(b.department));
  }, [items]);

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const pending = items.filter((i) => !done.has(i.person.id));
  const completed = items.filter((i) => done.has(i.person.id));
  const countFor = (tones: DecisionTone[]) => pending.filter((i) => tones.includes(i.decision.tone)).length;

  if (!hasData) {
    return (
      <div>
        <PageHeader title="Acciones pendientes · RR.HH." subtitle="Decisiones de gestión derivadas del desempeño del equipo." />
        <Card className="p-12 text-center text-sm text-slate-400">
          El tablero de acciones se activa cuando hay colaboradores evaluados.
          <br />
          (Datos de demostración disponibles en la empresa <b>Americana 2000</b>.)
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Acciones pendientes · RR.HH."
        subtitle="Decisiones de gestión derivadas de la tendencia de cada colaborador. Prioriza riesgos, reconoce el buen desempeño."
        actions={
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        }
      />

      {/* Resumen */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Atención / riesgo" value={String(countFor(['critical', 'negative']))} delta="advertencia · suspensión · desvinculación" icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Reconocer / premiar" value={String(countFor(['positive']))} delta="reconocimiento · bono · aumento" icon={<Award className="h-5 w-5" />} />
        <StatCard label="Seguimiento" value={String(countFor(['neutral']))} delta="acompañamiento · capacitación" icon={<Eye className="h-5 w-5" />} />
      </div>

      {/* Reportes a gerentes */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          <FileText className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-700">Reportes a gerentes</h2>
          <span className="text-xs text-slate-400">— envía a cada gerente el estado de su equipo</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((c) => (
            <div key={c.department} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-900">{c.manager}</p>
              <p className="text-xs text-slate-500">Gerente · {c.department}</p>
              <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
                <span className="text-green-600" title="A reconocer / premiar">● {c.reward}</span>
                <span className="text-amber-600" title="En seguimiento">● {c.followup}</span>
                <span className="text-red-600" title="En riesgo">● {c.risk}</span>
              </div>
              <Button variant="secondary" className="mt-3 w-full justify-center" onClick={() => setReportDept(c.department)}>
                <Send className="h-4 w-4" /> Ver / enviar reporte
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Buckets de acciones */}
      <div className="space-y-6">
        {BUCKETS.map((bucket) => {
          const list = pending.filter((i) => bucket.tones.includes(i.decision.tone));
          if (list.length === 0) return null;
          const Icon = bucket.icon;
          return (
            <div key={bucket.key}>
              <h2 className={`mb-3 flex items-center gap-2 text-sm font-bold ${bucket.accent}`}>
                <Icon className="h-4 w-4" /> {bucket.title}
                <span className="text-slate-400">· {list.length}</span>
              </h2>
              <div className="space-y-3">
                {list.map((item) => (
                  <ActionRow
                    key={item.person.id}
                    item={item}
                    done={false}
                    onToggle={() => toggleDone(item.person.id)}
                    onOpen={() => setSelectedId(item.person.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {pending.length === 0 && (
          <Card className="p-10 text-center text-sm text-slate-400">
            🎉 No hay acciones pendientes para esta selección.
          </Card>
        )}

        {/* Completadas */}
        {completed.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-500">
              <ClipboardCheck className="h-4 w-4" /> Completadas <span className="text-slate-400">· {completed.length}</span>
            </h2>
            <div className="space-y-3">
              {completed.map((item) => (
                <ActionRow
                  key={item.person.id}
                  item={item}
                  done
                  onToggle={() => toggleDone(item.person.id)}
                  onOpen={() => setSelectedId(item.person.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && <PersonProfileModal person={selected} onClose={() => setSelectedId(null)} />}
      {reportDept && <ManagerReportModal department={reportDept} onClose={() => setReportDept(null)} />}
    </div>
  );
}

function ActionRow({
  item,
  done,
  onToggle,
  onOpen,
}: {
  item: ActionItem;
  done: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { person, decision } = item;
  const light = periodLight(person.history[person.history.length - 1]);
  return (
    <Card className={`p-4 ${done ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {person.initials}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${LIGHT_META[light].dot}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-bold text-slate-900 ${done ? 'line-through' : ''}`}>{person.name}</p>
            <Badge variant={TONE_BADGE[decision.tone]}>{decision.label}</Badge>
          </div>
          <p className="text-xs text-slate-500">{person.role} · {person.department}</p>
          <p className="mt-1.5 text-sm text-slate-600">{decision.detail}</p>
          <p className="mt-0.5 text-xs text-slate-400">Base: {decision.rationale}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <Button variant="secondary" onClick={onOpen}>Ver perfil</Button>
          <Button variant={done ? 'ghost' : 'primary'} onClick={onToggle}>
            {done ? (
              <>
                <RotateCcw className="h-4 w-4" /> Reabrir
              </>
            ) : (
              <>
                <ClipboardCheck className="h-4 w-4" /> Marcar hecha
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
