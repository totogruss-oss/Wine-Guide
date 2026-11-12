import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { RebsorteIcon } from './RebsorteIcon';
import { uniqueRebsorten } from '../lib/wineFields';

interface RebsortenInputProps {
  label?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Mehrere Rebsorten als Chips. Hinzufügen per Vorschlag, Enter, Komma
 * oder einfach Weitertippen und Feld verlassen.
 */
export function RebsortenInput({ label, options, value, onChange }: RebsortenInputProps) {
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chosen = new Set(value.map(v => v.toLowerCase()));
  const query = text.trim().toLowerCase();
  const suggestions = options
    .filter(o => !chosen.has(o.toLowerCase()))
    .filter(o => !query || o.toLowerCase().includes(query));

  const add = (raw: string) => {
    const next = uniqueRebsorten([...value, ...raw.split(',')]);
    if (next.length !== value.length) onChange(next);
    setText('');
  };

  const remove = (sorte: string) => onChange(value.filter(v => v !== sorte));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-1.5" ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-[#787774]">
          {label}
          {value.length > 1 && <span className="ml-2 text-xs font-normal text-[#a0a09f]">Cuvée aus {value.length} Sorten</span>}
        </label>
      )}
      <div
        className="w-full min-h-[38px] p-1.5 bg-[#f7f7f5] border border-transparent focus-within:border-[#e9e9e7] focus-within:bg-white rounded-md flex flex-wrap items-center gap-1.5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(sorte => (
          <span
            key={sorte}
            className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-white border border-[#e9e9e7] rounded-full text-xs font-medium text-[#37352f]"
          >
            <RebsorteIcon rebsorte={sorte} className="w-3 h-3" />
            {sorte}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(sorte); }}
              className="p-0.5 rounded-full hover:bg-[#f7f7f5] text-[#787774]"
              aria-label={`${sorte} entfernen`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => {
            const v = e.target.value;
            if (v.includes(',')) add(v);
            else setText(v);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => { if (text.trim()) add(text); }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (text.trim()) add(text);
            } else if (e.key === 'Backspace' && !text && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length ? 'Weitere Sorte …' : 'z. B. Merlot – für Cuvées mehrere'}
          className="flex-1 min-w-[8rem] px-1 py-0.5 bg-transparent text-sm outline-none"
          autoComplete="off"
          enterKeyHint="done"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-[#e9e9e7] rounded-md shadow-lg">
          {suggestions.map(option => (
            <li
              key={option}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-[#f7f7f5] flex items-center gap-2"
              // mousedown statt click: sonst verliert das Eingabefeld vorher den Fokus
              // und würde den angefangenen Text schon als eigene Sorte übernehmen.
              onMouseDown={e => {
                e.preventDefault();
                add(option);
              }}
            >
              <span className="text-base leading-none"><RebsorteIcon rebsorte={option} /></span>
              <span>{option}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
