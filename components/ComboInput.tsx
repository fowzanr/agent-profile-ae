"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export function ComboInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  autoFocus,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = value.trim().toLowerCase();
  const suggestions = (q ? options.filter((o) => o.toLowerCase().includes(q)) : options).filter(
    (o) => o.toLowerCase() !== q,
  );

  return (
    <div className="tag-select" ref={wrapRef}>
      <div className="tag-select-input-wrap">
        <input
          id={id}
          className="tag-select-input"
          type="text"
          value={value}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <ChevronDownIcon className={`tag-select-chevron${open ? " open" : ""}`} />
      </div>
      {open && suggestions.length > 0 && (
        <div className="tag-select-dropdown">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              className="tag-select-option"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
