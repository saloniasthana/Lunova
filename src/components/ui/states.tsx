"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent } from "./dialog";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  art,
  className,
  compact,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  art?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-6" : "py-12", className)}>
      {art ?? <MoonArt />}
      <h3 className="mt-4 font-display text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MoonArt({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden className="animate-float">
      <circle cx="40" cy="40" r="34" fill="var(--accent-soft)" />
      <path d="M46 18a22 22 0 1 0 14 38 18 18 0 0 1-14-38Z" fill="var(--card)" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="22" cy="20" r="2" fill="var(--lavender)" />
      <circle cx="62" cy="24" r="1.5" fill="var(--accent)" />
      <circle cx="64" cy="58" r="2" fill="var(--pink)" />
    </svg>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-danger/20 text-[#b45555]">
        <AlertCircle className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-bold">Something went a little sideways</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Confirmation modal for destructive actions. Optionally requires typing a word. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  requireText,
  danger = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  requireText?: string;
  danger?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} className="sm:max-w-md">
        <ConfirmBody onClose={() => onOpenChange(false)} confirmLabel={confirmLabel} onConfirm={onConfirm} requireText={requireText} danger={danger} />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmBody({
  onClose,
  confirmLabel,
  onConfirm,
  requireText,
  danger,
}: {
  onClose: () => void;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  requireText?: string;
  danger: boolean;
}) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const disabled = busy || (requireText ? text !== requireText : false);
  return (
    <>
      {requireText && (
        <div className="mb-4">
          <p className="mb-2 text-sm text-muted">
            Type <strong className="text-ink">{requireText}</strong> to confirm.
          </p>
          <Input value={text} onChange={(e) => setText(e.target.value)} aria-label={`Type ${requireText} to confirm`} autoFocus />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          disabled={disabled}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}
