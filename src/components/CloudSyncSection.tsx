import React, { useEffect, useState } from 'react';
import { Cloud, LogOut, RefreshCw, Loader2, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncNow, resetPullCursor, requestSync } from '../lib/sync';
import { useSyncStatus } from '../hooks/useSyncStatus';

const formatTime = (ms: number | null) =>
  ms ? new Date(ms).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : 'noch nie';

/** Einstellungen → Gemeinsame Datenbank: Anmelden, Status, Abmelden */
export function CloudSyncSection() {
  const status = useSyncStatus();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setLoginError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setLoginError(
        error.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort stimmt nicht.'
          : `Anmeldung fehlgeschlagen: ${error.message}`
      );
      return;
    }
    setPassword('');
    resetPullCursor(); // nach dem Anmelden einmal alles abgleichen
    requestSync();
  };

  const signOut = async () => {
    if (!supabase) return;
    if (
      status.pending > 0 &&
      !window.confirm(
        `${status.pending} Änderung(en) sind noch nicht hochgeladen. Sie bleiben auf diesem Gerät und werden nach der nächsten Anmeldung hochgeladen. Trotzdem abmelden?`
      )
    ) {
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <section className="bg-white border border-[#e9e9e7] rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-[#787774]" />
        <h2 className="text-lg font-semibold">Gemeinsame Datenbank</h2>
      </div>

      {!isSupabaseConfigured && (
        <p className="text-sm text-[#787774]">
          Noch nicht eingerichtet. Eure Weine werden bisher nur auf diesem Gerät gespeichert. Bitte regelmäßig unten als JSON sichern.
        </p>
      )}

      {isSupabaseConfigured && !userEmail && (
        <form onSubmit={signIn} className="space-y-3">
          <p className="text-sm text-[#787774]">
            Melde dich an, damit eure Weine sicher online gespeichert und auf beiden Handys abgeglichen werden.
          </p>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
          />
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
          />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 bg-[#37352f] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#2f2d28] transition-colors disabled:opacity-50"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Anmelden
          </button>
        </form>
      )}

      {isSupabaseConfigured && userEmail && (
        <div className="space-y-3 text-sm">
          <p>
            Angemeldet als <span className="font-medium">{userEmail}</span>
          </p>

          <div className="flex items-start gap-2 p-3 rounded-md bg-[#f7f7f5]">
            {status.state === 'ok' && status.pending === 0 && <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />}
            {status.state === 'syncing' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-0.5 shrink-0" />}
            {status.state === 'offline' && <CloudOff className="w-4 h-4 text-[#787774] mt-0.5 shrink-0" />}
            {status.state === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />}
            {status.state === 'ok' && status.pending > 0 && <Cloud className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />}
            <div>
              <p>
                {status.state === 'ok' && status.pending === 0 && 'Alle Weine sind online gesichert.'}
                {status.state === 'ok' && status.pending > 0 && `${status.pending} Änderung(en) warten auf das Hochladen.`}
                {status.state === 'syncing' && 'Wird abgeglichen …'}
                {status.state === 'offline' &&
                  `Kein Internet. ${status.pending} Änderung(en) werden hochgeladen, sobald wieder Netz da ist.`}
                {status.state === 'error' && `Abgleich fehlgeschlagen: ${status.error}`}
                {status.state === 'signedOut' && 'Nicht angemeldet.'}
              </p>
              <p className="text-xs text-[#787774] mt-1">Letzter Abgleich: {formatTime(status.lastSyncAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void syncNow()}
              disabled={status.state === 'syncing'}
              className="flex items-center gap-2 bg-[#f7f7f5] text-[#37352f] border border-[#e9e9e7] px-4 py-2 rounded-md font-medium text-sm hover:bg-[#efefed] transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> Jetzt abgleichen
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-[#f7f7f5] text-[#37352f] border border-[#e9e9e7] px-4 py-2 rounded-md font-medium text-sm hover:bg-[#efefed] transition-colors"
            >
              <LogOut className="w-4 h-4" /> Abmelden
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
