import { useState, type FormEvent } from 'react';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/primitives';
import { notifySuccess } from '../../lib/notify';
import { cn } from '../../lib/utils';
import { MIN_PASSWORD_LENGTH, newPasswordProblem } from './password';

const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500';

/**
 * Formulario de contraseña nueva (dos veces). Lo usan la pantalla del enlace del correo
 * y la sección "Tu contraseña" de Configuración. `onSave` guarda y devuelve el error en español o null.
 */
export function NewPasswordForm({
  onSave,
  onDone,
  inline = false,
}: {
  onSave: (password: string) => Promise<string | null>;
  onDone?: () => void;
  /** En Configuración los campos van uno al lado del otro. */
  inline?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local = newPasswordProblem(password, repeat);
    setProblem(local);
    if (local) return;
    setSaving(true);
    const err = await onSave(password);
    setSaving(false);
    setProblem(err);
    if (err) return;
    setPassword('');
    setRepeat('');
    notifySuccess('Listo: tu contraseña quedó cambiada.');
    onDone?.();
  };

  return (
    <form onSubmit={submit} noValidate aria-describedby={problem ? 'new-password-problem' : undefined}>
      <div className={cn(inline ? 'flex flex-wrap items-start gap-3' : 'space-y-4')}>
        <Field label="Contraseña nueva" help={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`} className={inline ? 'min-w-[200px] flex-1' : undefined}>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Repítela" className={inline ? 'min-w-[200px] flex-1' : undefined}>
          <input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={inputCls} />
        </Field>
        {inline && (
          <Button type="submit" loading={saving} className="mt-[22px]">
            {saving ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
        )}
      </div>
      {problem && (
        <p id="new-password-problem" role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {problem}
        </p>
      )}
      {!inline && (
        <Button type="submit" loading={saving} className="mt-4 w-full justify-center py-2.5">
          {saving ? 'Guardando…' : 'Guardar y entrar'}
        </Button>
      )}
    </form>
  );
}
