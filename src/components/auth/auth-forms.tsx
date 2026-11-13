"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function PasswordInput({ id, invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} className="pr-10" aria-invalid={invalid} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function GoogleButton({ enabled, label }: { enabled: boolean; label: string }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <div>
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        disabled={!enabled || busy}
        onClick={() => {
          setBusy(true);
          void signIn("google", { redirectTo: "/dashboard" });
        }}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        {label}
      </Button>
      {!enabled && <p className="mt-1.5 text-center text-[11px] text-muted">Google sign-in isn&apos;t configured on this server yet.</p>}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-semibold text-muted">
      <span className="h-px flex-1 bg-line" />
      or continue with email
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

// ───────────────────────── Login ─────────────────────────

const loginForm = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = React.useState<string | null>(params.get("error") ? "We couldn't sign you in. Please try again." : null);
  const [forgot, setForgot] = React.useState(false);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof loginForm>>({
    resolver: zodResolver(loginForm),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = handleSubmit(async ({ email, password, remember }) => {
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      setError("That email and password don't match. Please try again.");
      return;
    }
    // "Remember me" off → end the session when the browser is closed (see AppShell).
    try {
      if (remember) localStorage.removeItem("lunova-session-only");
      else localStorage.setItem("lunova-session-only", "1");
      sessionStorage.setItem("lunova-alive", "1");
    } catch {
      /* storage unavailable */
    }
    router.replace(params.get("callbackUrl")?.startsWith("/") ? params.get("callbackUrl")! : "/dashboard");
    router.refresh();
  });

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">Welcome back to your little universe.</h1>
      <p className="mt-2 text-muted">Your peaceful workspace is waiting for you.</p>
      <div className="mt-8">
        <GoogleButton enabled={googleEnabled} label="Continue with Google" />
      </div>
      <Divider />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-[#a14a4a] dark:text-danger">
            {error}
          </p>
        )}
        <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!formState.errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={formState.errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" invalid={!!formState.errors.password} {...register("password")} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted">
            <input type="checkbox" className="size-4 accent-[var(--accent-strong)]" {...register("remember")} />
            Remember me
          </label>
          <button type="button" onClick={() => setForgot((f) => !f)} className="font-semibold text-accent-strong hover:underline">
            Forgot password?
          </button>
        </div>
        {forgot && (
          <p className="rounded-2xl bg-accent-soft px-4 py-3 text-xs text-ink">
            Password reset emails need an email provider, which isn&apos;t configured on this server yet. See the README for how to enable
            it — meanwhile, ask the workspace owner to help reset your account.
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="animate-spin" />}
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Lunova?{" "}
        <Link href="/signup" className="font-semibold text-accent-strong hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

// ───────────────────────── Signup ─────────────────────────

const signupForm = z
  .object({
    name: z.string().trim().min(1, "Please tell us your name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const { register, handleSubmit, formState, setError: setFieldError } = useForm<z.infer<typeof signupForm>>({
    resolver: zodResolver(signupForm),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }).catch(() => null);
    if (!res) return setError("You seem to be offline. Please try again.");
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: { message: string; fields?: Record<string, string> } } | null;
      if (json?.error?.fields?.email) setFieldError("email", { message: json.error.message });
      else setError(json?.error?.message ?? "We couldn't create your account.");
      return;
    }
    const login = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (!login || login.error) return router.replace("/login");
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">Create your little universe.</h1>
      <p className="mt-2 text-muted">A calm place for your tasks, focus, and habits.</p>
      <div className="mt-8">
        <GoogleButton enabled={googleEnabled} label="Sign up with Google" />
      </div>
      <Divider />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-[#a14a4a]">
            {error}
          </p>
        )}
        <Field label="Full name" htmlFor="name" error={formState.errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Your name" aria-invalid={!!formState.errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!formState.errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={formState.errors.password?.message} hint="At least 8 characters">
          <PasswordInput id="password" autoComplete="new-password" invalid={!!formState.errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={formState.errors.confirmPassword?.message}>
          <PasswordInput id="confirm" autoComplete="new-password" invalid={!!formState.errors.confirmPassword} {...register("confirmPassword")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent-strong hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
