"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export function TagSelect({
  options,
  value,
  onChange,
  placeholder = "Type to add…",
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  function addTag(tag: string) {
    if (!selected.includes(tag)) onChange([...selected, tag].join(", "));
    setQuery("");
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(selected.filter((t) => t !== tag).join(", "));
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const available = options.filter((o) => !selected.includes(o));
  const suggestions = q ? available.filter((o) => o.toLowerCase().includes(q)) : available;

  return (
    <div className="tag-select" ref={wrapRef}>
      {selected.length > 0 && (
        <div className="tag-select-tags">
          {selected.map((tag) => (
            <span className="tag-pill" key={tag}>
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="tag-select-input-wrap">
        <input
          className="tag-select-input"
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <ChevronDownIcon className={`tag-select-chevron${open ? " open" : ""}`} />
      </div>
      {open && (
        <div className="tag-select-dropdown">
          {suggestions.length > 0 ? (
            suggestions.map((s) => (
              <button type="button" key={s} className="tag-select-option" onClick={() => addTag(s)}>
                {s}
              </button>
            ))
          ) : (
            <span className="tag-select-empty">No matches</span>
          )}
        </div>
      )}
    </div>
  );
}
