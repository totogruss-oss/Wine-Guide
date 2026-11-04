import { Link } from 'react-router-dom';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, LogIn } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { cn } from '../lib/utils';

/** Kleine Anzeige oben rechts: Ist alles in der gemeinsamen Datenbank? */
export function SyncIndicator() {
  const { state, pending } = useSyncStatus();
  if (state === 'disabled') return null;

  const view = {
    signedOut: { icon: LogIn, text: 'Anmelden', cls: 'text-amber-700 bg-amber-50' },
    offline: { icon: CloudOff, text: pending ? `Offline · ${pending} offen` : 'Offline', cls: 'text-[#787774] bg-[#f7f7f5]' },
    syncing: { icon: RefreshCw, text: 'Sync…', cls: 'text-blue-700 bg-blue-50' },
    ok: pending
      ? { icon: Cloud, text: `${pending} offen`, cls: 'text-blue-700 bg-blue-50' }
      : { icon: CheckCircle2, text: 'Gesichert', cls: 'text-green-700 bg-green-50' },
    error: { icon: AlertTriangle, text: 'Sync-Fehler', cls: 'text-red-700 bg-red-50' },
  }[state];

  return (
    <Link
      to="/settings"
      title="Gemeinsame Datenbank"
      className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', view.cls)}
    >
      <view.icon className={cn('w-3.5 h-3.5', state === 'syncing' && 'animate-spin')} />
      <span>{view.text}</span>
    </Link>
  );
}
