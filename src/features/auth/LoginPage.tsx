import { useState, type FormEvent } from 'react';
import { APP } from '../../core/config';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/primitives';

const inputCls =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-center text-2xl font-bold tracking-tight text-brand-700">{APP.name}</h1>
        <p className="mt-1 text-center text-xs text-stone-500">{APP.tagline}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-stone-700">
            Correo
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-600/40"
          >
            Entrar
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </form>
        <p className="mt-6 text-center text-xs text-stone-500">
          ¿Olvidaste tu contraseña? Pídele a Oscar que la restablezca.
        </p>
      </Card>
    </div>
  );
}
