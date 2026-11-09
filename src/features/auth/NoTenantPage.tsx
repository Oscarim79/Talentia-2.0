import { useAuth } from '../../context/AuthContext';
import { Button, Card } from '../../components/ui/primitives';

export default function NoTenantPage() {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="text-sm text-stone-700">Tu cuenta no está asignada a ninguna empresa; avísale a Oscar.</p>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => void signOut()}>Cerrar sesión</Button>
        </div>
      </Card>
    </div>
  );
}
