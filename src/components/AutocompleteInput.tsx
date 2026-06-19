import React, { useState, useRef, useEffect } from 'react';

export type AutocompleteOption = string | { value: string; label: string; icon?: React.ReactNode };

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  options: AutocompleteOption[];
  onValueChange: (value: string) => void;
  label?: string;
  value?: string;
}

export function AutocompleteInput({ options, onValueChange, label, value, ...props }: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = options.filter(option => {
        const optionLabel = typeof option === 'string' ? option : option.label;
        return optionLabel.toLowerCase().includes(String(value).toLowerCase());
      });
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-1.5" ref={wrapperRef}>
      {label && <label className="text-sm font-medium text-[#787774]">{label}</label>}
      <input
        {...props}
        value={value || ''}
        onChange={(e) => {
          onValueChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={`w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none ${props.className || ''}`}
        autoComplete="off"
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-[#e9e9e7] rounded-md shadow-lg">
          {filteredOptions.map((option, index) => {
            const isString = typeof option === 'string';
            const optionValue = isString ? option : option.value;
            const optionLabel = isString ? option : option.label;
            const optionIcon = isString ? null : option.icon;

            return (
              <li
                key={index}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-[#f7f7f5] flex items-center gap-2"
                onClick={() => {
                  onValueChange(optionValue);
                  setIsOpen(false);
                }}
              >
                {optionIcon && <span className="text-base leading-none">{optionIcon}</span>}
                <span>{optionLabel}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
