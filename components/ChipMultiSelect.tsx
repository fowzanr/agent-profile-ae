"use client";

export function ChipMultiSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = new Set(
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );

  function toggle(option: string) {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(Array.from(next).join(", "));
  }

  return (
    <div className="chip-select">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={`chip-option${selected.has(option) ? " active" : ""}`}
          onClick={() => toggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
