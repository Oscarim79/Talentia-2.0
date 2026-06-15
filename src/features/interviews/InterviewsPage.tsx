import { Phone, MessageCircle, Video, AlertTriangle, Bot, User } from 'lucide-react';
import { Card, PageHeader, Badge } from '../../components/ui/primitives';
import type { InterviewTurn, Discrepancy } from '../../types';

const CHANNELS = [
  { icon: Phone, label: 'Teléfono', desc: 'Agente de voz (Vapi/Retell)', tag: 'Fase 3' },
  { icon: MessageCircle, label: 'WhatsApp', desc: 'Entrevista por texto + agendamiento', tag: 'Fase 2' },
  { icon: Video, label: 'Google Meet', desc: 'Bot que graba y transcribe (Recall.ai)', tag: 'Fase 3' },
];

const TRANSCRIPT: (InterviewTurn & { score?: number })[] = [
  { role: 'agent', content: 'Hola María, soy el asistente de TALENTIA. ¿Qué experiencia tienes en venta de productos de alto valor?' },
  { role: 'candidate', content: 'Trabajé 4 años en MultiMotos vendiendo motocicletas con financiamiento.', score: 9 },
  { role: 'agent', content: '¿Cómo manejas a un cliente indeciso?' },
  { role: 'candidate', content: 'Identifico su necesidad real y le muestro opciones de pago accesibles.', score: 8 },
  { role: 'agent', content: '¿Tienes disponibilidad de horario rotativo y fines de semana?' },
  { role: 'candidate', content: 'Sí, sin problema.', score: 10 },
];

const DISCREPANCIES: Discrepancy[] = [
  { topic: 'Años de experiencia', cvClaim: 'CV: 6 años en ventas', interviewClaim: 'Entrevista: mencionó 4 años en MultiMotos' },
];

export default function InterviewsPage() {
  return (
    <div>
      <PageHeader
        title="Entrevistas IA"
        subtitle="El agente entrevista, transcribe, puntúa y detecta discrepancias CV vs. respuestas."
        actions={<Badge variant="amber">Vista previa · Fases 2–3</Badge>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CHANNELS.map((ch) => (
          <Card key={ch.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                <ch.icon className="h-5 w-5" />
              </div>
              <Badge variant="slate">{ch.tag}</Badge>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">{ch.label}</p>
            <p className="text-xs text-slate-500">{ch.desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-slate-700">
            Transcripción simulada — María González (WhatsApp)
          </h2>
          <div className="space-y-3">
            {TRANSCRIPT.map((t, i) => (
              <div key={i} className={`flex gap-3 ${t.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    t.role === 'agent' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {t.role === 'agent' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    t.role === 'agent' ? 'bg-slate-100 text-slate-700' : 'bg-green-50 text-slate-800'
                  }`}
                >
                  {t.content}
                  {t.score != null && (
                    <div className="mt-1 text-right">
                      <Badge variant={t.score >= 8 ? 'green' : 'amber'}>respuesta {t.score}/10</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-700">Puntaje global IA</h3>
            <p className="text-4xl font-black text-green-600">90<span className="text-lg text-slate-400">/100</span></p>
            <p className="mt-1 text-xs text-slate-500">Recomendado para avanzar a oferta.</p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-600">
              <AlertTriangle className="h-4 w-4" /> Discrepancias detectadas
            </h3>
            <div className="space-y-3">
              {DISCREPANCIES.map((d, i) => (
                <div key={i} className="rounded-lg bg-amber-50 p-3 text-xs">
                  <p className="font-bold text-amber-800">{d.topic}</p>
                  <p className="mt-1 text-slate-600">{d.cvClaim}</p>
                  <p className="text-slate-600">{d.interviewClaim}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
