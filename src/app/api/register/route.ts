import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { fail, ok, parseBody, route } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { ensureUserSetup } from "@/server/users";

export const POST = route(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`register:${ip}`, 8, 60 * 60_000)) {
    return fail("Too many sign-up attempts. Please try again later.", 429);
  }
  const { name, email, password } = await parseBody(req, registerSchema);
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return fail("An account with this email already exists.", 409, { email: "Already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { name, email, passwordHash } });
  await ensureUserSetup(user.id);
  return ok({ id: user.id }, 201);
});
