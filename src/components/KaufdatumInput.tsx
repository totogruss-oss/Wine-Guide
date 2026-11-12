import React from 'react';
import {
  type DatumGenauigkeit,
  MONATSNAMEN,
  changeGenauigkeit,
  getGenauigkeit,
  parseKaufdatum,
} from '../lib/wineFields';

interface KaufdatumInputProps {
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}

const FELD = 'w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none';

const GENAUIGKEITEN: { key: DatumGenauigkeit; label: string }[] = [
  { key: 'tag', label: 'Tag' },
  { key: 'monat', label: 'Monat' },
  { key: 'jahr', label: 'Jahr' },
];

/** Kaufdatum wahlweise tagesgenau, nur Monat + Jahr oder nur Jahr. */
export function KaufdatumInput({ label = 'Kaufdatum', value, onChange }: KaufdatumInputProps) {
  const genauigkeit = getGenauigkeit(value);
  const teile = parseKaufdatum(value);

  const aktuellesJahr = new Date().getFullYear();
  const jahre = Array.from({ length: 41 }, (_, i) => aktuellesJahr - i);
  if (teile && !jahre.includes(teile.jahr)) jahre.push(teile.jahr);
  jahre.sort((a, b) => b - a);

  const setMonat = (monat: string) => {
    const jahr = teile?.jahr ?? aktuellesJahr;
    onChange(`${jahr}-${monat}`);
  };

  const setJahr = (jahr: string) => {
    if (!jahr) return onChange(undefined);
    if (genauigkeit === 'monat') {
      const monat = String(teile?.monat ?? new Date().getMonth() + 1).padStart(2, '0');
      onChange(`${jahr}-${monat}`);
    } else {
      onChange(jahr);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#787774]">{label}</label>
        <div className="flex bg-[#f7f7f5] rounded-md p-0.5" role="group" aria-label="Genauigkeit des Kaufdatums">
          {GENAUIGKEITEN.map(g => (
            <button
              key={g.key}
              type="button"
              onClick={() => onChange(value ? changeGenauigkeit(value, g.key) : g.key === 'tag' ? undefined : changeGenauigkeit(undefined, g.key))}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${genauigkeit === g.key ? 'bg-white text-[#37352f] shadow-sm' : 'text-[#787774] hover:text-[#37352f]'}`}
              aria-pressed={genauigkeit === g.key}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {genauigkeit === 'tag' && (
        <input
          type="date"
          value={value || ''}
          onChange={e => onChange(e.target.value || undefined)}
          className={FELD}
        />
      )}

      {genauigkeit !== 'tag' && (
        <div className="flex gap-2">
          {genauigkeit === 'monat' && (
            <select
              value={teile?.monat ? String(teile.monat).padStart(2, '0') : ''}
              onChange={e => setMonat(e.target.value)}
              className={`${FELD} flex-[3]`}
              aria-label="Monat"
            >
              {MONATSNAMEN.map((name, i) => (
                <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
              ))}
            </select>
          )}
          <select
            value={teile ? String(teile.jahr) : ''}
            onChange={e => setJahr(e.target.value)}
            className={`${FELD} flex-[2]`}
            aria-label="Jahr"
          >
            <option value="">Kein Datum</option>
            {jahre.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
