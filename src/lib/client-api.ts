export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

let signingOut = false;

/**
 * Clears the session cookie and goes to /login. Just navigating to /login isn't enough:
 * with a stale-but-valid cookie the proxy would bounce straight back to /dashboard.
 */
async function endSession() {
  if (signingOut) return;
  signingOut = true;
  try {
    localStorage.removeItem("lunova-timer");
  } catch {
    /* storage unavailable */
  }
  const { signOutAction } = await import("@/app/actions");
  await signOutAction();
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("You seem to be offline. Please check your connection.", 0);
  }
  const json = (await res.json().catch(() => null)) as { data?: T; error?: { message: string; fields?: Record<string, string> } } | null;
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") void endSession();
    throw new ApiError(json?.error?.message ?? "Something went wrong. Please try again.", res.status, json?.error?.fields);
  }
  return json?.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body ?? {}),
  patch: <T>(url: string, body: unknown) => request<T>("PATCH", url, body),
  del: <T>(url: string) => request<T>("DELETE", url),
};
