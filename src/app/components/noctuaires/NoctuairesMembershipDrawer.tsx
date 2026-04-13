"use client";

import { useState, useEffect } from "react";
import { Drawer } from "vaul";

interface NoctuairesMembershipDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NoctuairesMembershipDrawer({
  open,
  onClose,
}: NoctuairesMembershipDrawerProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    instagram: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"bottom" | "right">("bottom");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setDirection(mq.matches ? "right" : "bottom");
    const handler = (e: MediaQueryListEvent) =>
      setDirection(e.matches ? "right" : "bottom");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setError(null);
      setFormData({ name: "", email: "", phone: "", instagram: "" });
    }, 300);
  };

  const isRight = direction === "right";

  return (
    <Drawer.Root
      direction={direction}
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Drawer.Content
          className={
            isRight
              ? "fixed top-0 right-0 bottom-0 z-50 flex flex-col w-[min(420px,90vw)] border-l border-white/[0.06]"
              : "fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[2px] border-t border-white/[0.06]"
          }
          style={{
            backgroundColor: "#120606",
            maxHeight: isRight ? undefined : "90dvh",
          }}
        >
          {/* Mobile drag handle */}
          {!isRight && (
            <div className="mx-auto w-10 h-[3px] shrink-0 rounded-full bg-white/15 mt-3" />
          )}

          <div
            className={`flex flex-col h-full overflow-y-auto ${isRight ? "px-8 py-10" : "px-6 pt-6 pb-8"}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <Drawer.Title className="font-display italic text-[clamp(1.25rem,3vw,1.75rem)] text-white leading-tight">
                  {submitted ? "Noted." : "Request Membership"}
                </Drawer.Title>
                <Drawer.Description className="font-body text-[0.6875rem] tracking-[0.02em] text-white/30 mt-2">
                  {submitted
                    ? "We\u2019ll be in touch if the room has space."
                    : "Behind the painting, past the stairs."}
                </Drawer.Description>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="cursor-pointer text-white/30 hover:text-white/60 transition-colors duration-300 p-1 -mr-1 -mt-1"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            <div
              className="w-full h-px mb-8"
              style={{
                background:
                  "linear-gradient(to right, rgba(228,49,34,0.15), transparent)",
              }}
            />

            {submitted ? (
              <div className="mt-4">
                <p
                  className="font-display italic text-[0.9375rem] leading-relaxed"
                  style={{ color: "rgba(240, 230, 218, 0.4)" }}
                >
                  Someone will reach out. Or they won&apos;t.
                  <br />
                  That&apos;s how these things work.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 flex-1"
              >
                <Field
                  label="Name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  disabled={submitting}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={submitting}
                />
                <Field
                  label="Phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+46 70 123 45 67"
                  disabled={submitting}
                />
                <Field
                  label="Instagram"
                  name="instagram"
                  type="text"
                  required
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@handle"
                  disabled={submitting}
                />

                {error && (
                  <p className="font-body text-[0.75rem] text-[#e84e3c]">
                    {error}
                  </p>
                )}

                <div className={isRight ? "mt-auto pt-6" : "mt-2"}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full font-body text-[0.625rem] font-semibold tracking-[0.12em] uppercase text-[#f0e6da] py-4 bg-[var(--background)] hover:brightness-125 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting\u2026" : "Submit Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Field({
  label,
  name,
  type,
  required,
  value,
  onChange,
  placeholder,
  disabled,
  optional,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="flex items-baseline gap-2 mb-2 font-body text-[0.5625rem] font-semibold tracking-[0.08em] uppercase text-white/40">
        {label}
        {optional && (
          <span className="font-normal tracking-normal normal-case text-white/20">
            optional
          </span>
        )}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full font-display italic text-[0.9375rem] text-white placeholder:text-white/15 bg-transparent border-b border-white/[0.08] focus:border-[#e84e3c]/40 px-0 py-3 outline-none transition-colors duration-300 disabled:opacity-40"
        placeholder={placeholder}
      />
    </div>
  );
}
