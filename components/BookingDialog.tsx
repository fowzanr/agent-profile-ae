"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, CheckIcon, CloseIcon, WhatsAppIcon } from "@/components/icons";
import { bookableDates, dubaiNow, formatBookingTime, openSlots, type BookingAvailability } from "@/lib/booking";

function dayChip(date: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${date}T12:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" }),
    month: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
  };
}

/** The pre-filled WhatsApp message the visitor sends to the agent. */
export function bookingWhatsAppMessage(agentFirstName: string, name: string, date: string, time: string, note: string) {
  return [
    `Hi ${agentFirstName}, I'd like to book a viewing on ${formatBookingTime(date, time)}.`,
    note ? `\n${note}` : null,
    `\n— ${name} (via agentprofile.ae)`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Booking request form shown when the agent takes bookings through the platform. Visitors either send the
 * request on WhatsApp (pre-filled chat to the agent) or by email. Both are saved and emailed to the agent.
 */
export function BookingDialog({
  agentId,
  agentFirstName,
  agentWhatsapp,
  availability,
  onClose,
}: {
  agentId: string;
  agentFirstName: string;
  agentWhatsapp: string;
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
  const [sent, setSent] = useState<"email" | "whatsapp" | null>(null);
  const [waUrl, setWaUrl] = useState("");
  const waDigits = agentWhatsapp.replace(/[^\d]/g, "");
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

  function validate(needContact: boolean): string | null {
    if (!name.trim()) return "Add your name.";
    if (needContact && !contact.trim()) return "Add a phone number or email so we can confirm.";
    if (!date) return "Pick a day.";
    if (!slot) return "Pick a time.";
    return null;
  }

  function leadBody(via?: "whatsapp") {
    return JSON.stringify({
      agentId,
      channel: "book",
      name: name.trim(),
      contact: contact.trim() || undefined,
      preferredDate: date,
      preferredTime: slot,
      message: note.trim() || undefined,
      via,
    });
  }

  // Opens WhatsApp straight from the tap (so phones don't block it) and saves the request in the background.
  function sendOnWhatsApp() {
    setError(null);
    const problem = validate(false);
    if (problem) return setError(problem);
    const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(
      bookingWhatsAppMessage(agentFirstName, name.trim(), date, slot!, note.trim()),
    )}`;
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: leadBody("whatsapp"),
      keepalive: true,
    }).catch(() => {});
    window.open(url, "_blank", "noopener");
    setWaUrl(url);
    setSent("whatsapp");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = validate(true);
    if (problem) return setError(problem);

    setSending(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: leadBody(),
    }).catch(() => null);
    setSending(false);

    if (!res || !res.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? "Couldn't send your request. Try again in a moment.");
      return;
    }
    setSent("email");
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

        {sent === "whatsapp" ? (
          <div className="booking-done">
            <span className="booking-done-icon wa">
              <WhatsAppIcon className="w-5 h-5" />
            </span>
            <h3 id="booking-title">Finish in WhatsApp</h3>
            <p>
              Your message to {agentFirstName} is ready in WhatsApp. Tap <strong>send</strong> there so they get it,
              then {agentFirstName} will confirm the time.
            </p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="cta-primary booking-wa">
              <WhatsAppIcon className="w-4 h-4" />
              Open WhatsApp again
            </a>
            <button type="button" className="btn-secondary booking-alt" onClick={onClose}>
              Done
            </button>
          </div>
        ) : sent ? (
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
                <label htmlFor="booking-contact">
                  Phone or email{" "}
                  {waDigits && <span className="booking-optional">(not needed for WhatsApp)</span>}
                </label>
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

            <div className="booking-actions">
              {waDigits && (
                <button
                  type="button"
                  className="cta-primary booking-wa"
                  onClick={sendOnWhatsApp}
                  disabled={sending || dates.length === 0}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Send on WhatsApp
                </button>
              )}
              <button
                type="submit"
                className={waDigits ? "btn-secondary booking-alt" : "btn-primary booking-submit"}
                disabled={sending || dates.length === 0}
              >
                {sending ? "Sending…" : waDigits ? "Request by email instead" : "Request booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
