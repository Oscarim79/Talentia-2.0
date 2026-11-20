import { useState, type FormEvent } from 'react';
import { APP } from '../../core/config';
import { useAuth } from '../../context/AuthContext';
import { LogoMark, Wordmark } from '../../components/brand/Logo';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/primitives';

const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function LoginPage() {
  const { signIn, linkError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(linkError);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const msg = await signIn(email, password);
    setError(msg);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* Panel de marca: rojo-naranja, esferas y órbitas, nombre en blanco. */}
      <section className="relative overflow-hidden bg-brand-600 text-white lg:min-h-screen lg:w-[52%]">
        <OrbitArt />
        <div className="relative z-10 flex h-full flex-col justify-between gap-10 px-7 py-7 sm:px-12 sm:py-10">
          <LogoMark tone="white" className="h-10 w-10 sm:h-11 sm:w-11" />
          <div className="py-6 lg:py-0">
            <Wordmark className="h-8 w-auto max-w-full text-white sm:h-12 lg:h-[64px]" accentClassName="text-ink" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:mt-5 lg:max-w-none lg:whitespace-nowrap lg:text-[clamp(12px,1.15vw,15px)]">{APP.tagline}</p>
          </div>
          <p className="eyebrow hidden text-white/70 lg:block">
            Reclutamiento · Entrevistas IA · Gestión de talento
          </p>
        </div>
      </section>

      {/* Formulario */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Entrar</h1>
          <p className="mt-1 text-sm text-neutral-500">Usa tu correo y contraseña de {APP.name}.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" aria-describedby={error ? 'login-error' : undefined}>
            <Field label="Correo">
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </Field>
            {error && (
              <p id="login-error" role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" loading={submitting} className="w-full justify-center py-2.5">
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-6 text-xs text-neutral-500">¿Olvidaste tu contraseña? Pídele a Oscar que la restablezca.</p>
        </div>
      </section>
    </div>
  );
}

/** Decoración del panel de marca: dos esferas con grano y órbitas finas (solo visual). Colores desde la marca. */
function OrbitArt() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sphere" cx="38%" cy="32%" r="70%">
          <stop offset="0" style={{ stopColor: 'var(--color-brand-400)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--color-brand-800)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-brand-950)' }} />
        </radialGradient>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.35" />
          </feComponentTransfer>
        </filter>
        <clipPath id="big">
          <circle cx="560" cy="620" r="330" />
        </clipPath>
        <clipPath id="small">
          <circle cx="690" cy="120" r="110" />
        </clipPath>
      </defs>
      <circle cx="560" cy="620" r="330" fill="url(#sphere)" />
      <rect width="800" height="800" clipPath="url(#big)" filter="url(#grain)" style={{ fill: 'var(--color-ink)' }} />
      <circle cx="690" cy="120" r="110" fill="url(#sphere)" />
      <rect width="800" height="800" clipPath="url(#small)" filter="url(#grain)" style={{ fill: 'var(--color-ink)' }} />
      <g fill="none" strokeOpacity="0.38" strokeWidth="1.2" style={{ stroke: 'var(--color-canvas)' }}>
        <ellipse cx="520" cy="560" rx="470" ry="150" transform="rotate(-18 520 560)" />
        <ellipse cx="560" cy="640" rx="400" ry="90" transform="rotate(12 560 640)" />
        <ellipse cx="640" cy="160" rx="200" ry="60" transform="rotate(-24 640 160)" />
      </g>
    </svg>
  );
}
