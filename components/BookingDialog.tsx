"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, CheckIcon, CloseIcon } from "@/components/icons";
import { bookableDates, dubaiNow, openSlots, type BookingAvailability } from "@/lib/booking";

function dayChip(date: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${date}T12:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" }),
    month: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
  };
}

/** Booking request form shown when the agent takes bookings through the platform; the request is emailed to them. */
export function BookingDialog({
  agentId,
  agentFirstName,
  availability,
  onClose,
}: {
  agentId: string;
  agentFirstName: string;
  availability: BookingAvailability;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const dates = useMemo(() => bookableDates(availability), [availability]);
  const [date, setDate] = useState(dates[0] ?? "");
  const slots = useMemo(() => (date ? openSlots(availability, date) : []), [availability, date]);
  const [slot, setSlot] = useState<string | null>(null);
  const today = dubaiNow().date;
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Add your name.");
    if (!contact.trim()) return setError("Add a phone number or email so we can confirm.");
    if (!date) return setError("Pick a day.");
    if (!slot) return setError("Pick a time.");

    setSending(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        channel: "book",
        name: name.trim(),
        contact: contact.trim(),
        preferredDate: date,
        preferredTime: slot,
        message: note.trim() || undefined,
      }),
    }).catch(() => null);
    setSending(false);

    if (!res || !res.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? "Couldn't send your request. Try again in a moment.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="booking-overlay" onClick={onClose}>
      <div
        className="booking-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="booking-close" onClick={onClose} aria-label="Close">
          <CloseIcon className="w-4 h-4" />
        </button>

        {sent ? (
          <div className="booking-done">
            <span className="booking-done-icon">
              <CheckIcon className="w-5 h-5" />
            </span>
            <h3 id="booking-title">Request sent</h3>
            <p>
              {agentFirstName} will get back to you to confirm the time. Keep an eye on your phone or inbox.
            </p>
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="booking-head">
              <span className="booking-head-icon">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <div>
                <h3 id="booking-title">Book a viewing</h3>
                <p>Pick a time that suits you. {agentFirstName} will confirm.</p>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="booking-fields">
              <div className="field">
                <label htmlFor="booking-name">Your name</label>
                <input
                  id="booking-name"
                  ref={firstFieldRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={100}
                />
              </div>
              <div className="field">
                <label htmlFor="booking-contact">Phone or email</label>
                <input
                  id="booking-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  autoComplete="tel"
                  placeholder="+971 50 123 4567"
                  maxLength={200}
                />
              </div>
              <div className="field">
                <span className="booking-label">Day</span>
                {dates.length === 0 ? (
                  <p className="booking-empty">No times are open in the next two weeks. Try Call or WhatsApp instead.</p>
                ) : (
                  <div className="booking-days" role="radiogroup" aria-label="Day">
                    {dates.map((d) => {
                      const chip = dayChip(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={date === d}
                          className={`booking-day${date === d ? " active" : ""}`}
                          onClick={() => {
                            setDate(d);
                            setSlot(null);
                          }}
                        >
                          <small>{d === today ? "Today" : chip.weekday}</small>
                          <span>{chip.day}</span>
                          <small>{chip.month}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {slots.length > 0 && (
                <div className="field">
                  <span className="booking-label">
                    Time <span className="booking-optional">(Dubai time)</span>
                  </span>
                  <div className="booking-times" role="radiogroup" aria-label="Time">
                    {slots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={slot === t}
                        className={`booking-time${slot === t ? " active" : ""}`}
                        onClick={() => setSlot(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="field">
                <label htmlFor="booking-note">
                  Note <span className="booking-optional">(optional)</span>
                </label>
                <textarea
                  id="booking-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Which property, budget, or anything else"
                  maxLength={2000}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary booking-submit" disabled={sending || dates.length === 0}>
              {sending ? "Sending…" : "Request booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
