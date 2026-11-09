import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button, Card } from './ui/primitives';

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div role="status" className="flex items-center gap-3 text-sm font-medium text-stone-600">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        {label}
      </div>
    </div>
  );
}

export function ErrorScreen({
  message,
  onRetry,
  onSignOut,
}: {
  message: string;
  onRetry?: () => void;
  onSignOut?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
        <p role="alert" className="mt-4 text-sm text-stone-700">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {onRetry && <Button onClick={onRetry}>Reintentar</Button>}
          {onSignOut && <Button variant="secondary" onClick={onSignOut}>Cerrar sesión</Button>}
        </div>
      </Card>
    </div>
  );
}
