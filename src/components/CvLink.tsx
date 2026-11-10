import { FileText } from 'lucide-react';
import type { MouseEvent } from 'react';
import { providers } from '../core/providers';
import { notifyError } from '../lib/notify';

/** Botón "Ver CV": abre el archivo original (enlace temporal de Storage) en una pestaña nueva. Sin `cvPath` no se muestra. */
export function CvLink({ cvPath, className = '' }: { cvPath?: string; className?: string }) {
  if (!cvPath) return null;

  async function open(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    // La pestaña se abre antes de esperar al servidor: así el navegador no la bloquea como "ventana emergente".
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    const url = await providers.cvScreening.cvUrl(cvPath!);
    if (!url) {
      tab?.close();
      notifyError('No se pudo abrir el CV. Inténtalo de nuevo.');
      return;
    }
    if (tab) tab.location.href = url;
    else window.open(url, '_blank', 'noopener');
  }

  return (
    <button
      type="button"
      onClick={open}
      title="Abrir el CV original"
      className={`inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-700 ${className}`}
    >
      <FileText className="h-3 w-3" /> Ver CV
    </button>
  );
}
