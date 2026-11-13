"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  hideClose,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-[#2a2833]/25 backdrop-blur-[2px] data-[state=open]:animate-[fadeIn_200ms_ease] data-[state=closed]:animate-[fadeOut_150ms_ease]" />
      <D.Content
        className={cn(
          "fixed z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line bg-card shadow-[var(--shadow-lift)] focus:outline-none",
          "bottom-0 left-0 rounded-t-3xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          "data-[state=open]:animate-[dialogIn_220ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[fadeOut_150ms_ease]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <D.Title className="font-display text-lg font-bold text-ink">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          {!hideClose && (
            <D.Close
              className="-mr-2 -mt-1 rounded-xl p-2 text-muted transition-colors hover:bg-bg-2 hover:text-ink"
              aria-label="Close"
            >
              <X className="size-4" />
            </D.Close>
          )}
        </div>
        <div className="overflow-y-auto px-6 pb-6 pt-2">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
