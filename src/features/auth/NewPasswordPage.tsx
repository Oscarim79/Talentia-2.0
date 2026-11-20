import { useAuth } from '../../context/AuthContext';
import { LogoMark } from '../../components/brand/Logo';
import { NewPasswordForm } from './NewPasswordForm';

/** Se muestra al entrar con el enlace de "restablecer contraseña" del correo, antes de abrir la app. */
export default function NewPasswordPage() {
  const { email, updatePassword, finishRecovery, signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
      <div className="w-full max-w-sm">
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink">Elige tu nueva contraseña</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Entraste con el enlace del correo{email ? ` (${email})` : ''}. Escribe tu contraseña nueva para terminar.
        </p>
        <div className="mt-6">
          <NewPasswordForm onSave={updatePassword} onDone={finishRecovery} />
        </div>
        <button type="button" onClick={() => void signOut()} className="mt-6 text-xs font-medium text-neutral-500 underline hover:text-neutral-700">
          Cancelar y salir
        </button>
      </div>
    </div>
  );
}
