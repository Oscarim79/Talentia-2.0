import { useState } from 'react';
import { X, MessageCircle, Copy, Download, Check, AlertTriangle, Award, Eye } from 'lucide-react';
import { NINE_BOX } from '../../data/seed';
import { downloadTextFile, slugify } from '../../lib/utils';
import { Badge, Button } from '../../components/ui/primitives';
import { deriveDecision, bucketOf, toneBadge, type ActionBucket, type Decision } from './talentDecisions';
import type { NineBoxDataPoint } from '../../types';

const BUCKET_META: Record<ActionBucket, { title: string; emoji: string; icon: typeof Award; accent: string }> = {
  risk: { title: 'Atención / riesgo', emoji: '🔴', icon: AlertTriangle, accent: 'text-red-600' },
  reward: { title: 'Reconocer / premiar', emoji: '🟢', icon: Award, accent: 'text-green-600' },
  followup: { title: 'Seguimiento', emoji: '🟡', icon: Eye, accent: 'text-amber-600' },
};
const ORDER: ActionBucket[] = ['risk', 'reward', 'followup'];

interface Item {
  person: NineBoxDataPoint;
  decision: Decision;
}

export function ManagerReportModal({ department, onClose }: { department: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const people = NINE_BOX.filter((p) => p.department === department);
  const manager = people[0]
    ? { name: people[0].managerName, phone: people[0].managerPhone }
    : { name: '—', phone: '' };

  const grouped: Record<ActionBucket, Item[]> = { risk: [], reward: [], followup: [] };
  people.forEach((person) => {
    const decision = deriveDecision(person.history);
    grouped[bucketOf(decision.tone)].push({ person, decision });
  });

  // Versión de texto del reporte (para WhatsApp, copiar o descargar).
  const text = (() => {
    const lines: string[] = [];
    lines.push(`📋 Reporte de equipo · ${department}`);
    lines.push(`Para: ${manager.name} (gerente de ${department})`);
    lines.push(
      `${people.length} colaboradores · 🟢 ${grouped.reward.length} a reconocer · 🟡 ${grouped.followup.length} en seguimiento · 🔴 ${grouped.risk.length} en riesgo`,
    );
    ORDER.forEach((b) => {
      if (!grouped[b].length) return;
      lines.push('');
      lines.push(`${BUCKET_META[b].emoji} ${BUCKET_META[b].title}`);
      grouped[b].forEach((it) =>
        lines.push(`• ${it.person.name} (${it.person.role}) — ${it.decision.label}. ${it.decision.rationale}`),
      );
    });
    lines.push('');
    lines.push('— Generado por TALENTIA · RR.HH.');
    return lines.join('\n');
  })();

  const wa = `https://wa.me/${manager.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard puede estar bloqueado en el preview; ignora */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Reporte de equipo · RR.HH.</p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">{department}</h2>
            <p className="text-sm text-slate-500">Para {manager.name} · gerente del área</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Summary value={people.length} label="Colaboradores" />
            <Summary value={grouped.reward.length} label="A reconocer" tone="text-green-600" />
            <Summary value={grouped.followup.length} label="En seguimiento" tone="text-amber-600" />
            <Summary value={grouped.risk.length} label="En riesgo" tone="text-red-600" />
          </div>

          {/* Secciones por prioridad */}
          {ORDER.map((b) => {
            const list = grouped[b];
            if (!list.length) return null;
            const M = BUCKET_META[b];
            const Icon = M.icon;
            return (
              <div key={b}>
                <h3 className={`mb-2 flex items-center gap-2 text-sm font-bold ${M.accent}`}>
                  <Icon className="h-4 w-4" /> {M.title} <span className="text-slate-400">· {list.length}</span>
                </h3>
                <div className="space-y-2">
                  {list.map((it) => (
                    <div key={it.person.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {it.person.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{it.person.name}</p>
                          <Badge variant={toneBadge(it.decision.tone)}>{it.decision.label}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{it.person.role}</p>
                        <p className="mt-0.5 text-xs text-slate-400">Base: {it.decision.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Acciones de envío */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" /> Enviar al gerente por WhatsApp
            </a>
            <Button variant="secondary" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar texto'}
            </Button>
            <Button variant="secondary" onClick={() => downloadTextFile(`reporte-${slugify(department)}.txt`, text)}>
              <Download className="h-4 w-4" /> Descargar .txt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3 text-center">
      <p className={`text-2xl font-black ${tone ?? 'text-slate-900'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
