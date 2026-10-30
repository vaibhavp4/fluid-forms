import { LoaderCircle, AlertCircle, Check, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
export function Busy({ text = "Working…" }: { text?: string }) {
  return (
    <span className="busy">
      <LoaderCircle size={17} className="spin" />
      {text}
    </span>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : undefined}
    >
      <AlertCircle size={18} />
      <div>{children}</div>
    </div>
  );
}
export function Status({
  issue,
  review = false,
}: {
  issue: string;
  review?: boolean;
}) {
  const good = issue === "none" && !review;
  return (
    <span className={`status ${good ? "good" : "attention"}`}>
      {good ? <Check size={14} /> : <AlertCircle size={14} />}{" "}
      {review ? "Review needed" : good ? "On track" : "Needs attention"}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const container = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = container.current;
    const query =
      "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]";
    node?.querySelector<HTMLElement>(query)?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key === "Tab" && node) {
        const items = Array.from(node.querySelectorAll<HTMLElement>(query));
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={container}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
