import { cn } from "@/lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  // Gradient lives in CSS (not an SVG <defs> id) so multiple/hidden instances never break each other.
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-[30%]", className)}
      style={{ width: size, height: size, background: "linear-gradient(135deg, #9DC2EA, #C3BDF0 55%, #F2C6DC)" }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox="0 0 40 40">
        <path d="M24.5 10.5a10 10 0 1 0 5 17.8A8.2 8.2 0 0 1 24.5 10.5Z" fill="#fff" />
        <path d="M28.5 9l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z" fill="#fff" opacity="0.9" />
      </svg>
    </span>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="font-display text-xl font-extrabold tracking-tight text-ink">Lunova</span>}
    </span>
  );
}
