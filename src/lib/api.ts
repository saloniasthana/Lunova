import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Consistent API shape: { data } on success, { error } on failure. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ error: { message, fields } }, { status });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new HttpError(401, "Please sign in to continue.");
  // A session cookie can outlive its user (account deleted, or the database was switched).
  // Treat that as signed out instead of failing later with foreign-key errors.
  const exists = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new HttpError(401, "Your session has expired. Please sign in again.");
  return id;
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
  return schema.parse(json);
}

/** Throws 404 (not 403) when a record doesn't belong to the user, so ids can't be probed. */
export function assertOwned<T extends { userId: string } | null>(record: T, userId: string): asserts record is NonNullable<T> {
  if (!record || record.userId !== userId) throw new HttpError(404, "We couldn't find that item.");
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with consistent error handling. Never leaks internal errors. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.message, err.status);
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.issues) fields[issue.path.join(".") || "_"] = issue.message;
        return fail(err.issues[0]?.message ?? "Please check your input.", 422, fields);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") return fail("That already exists.", 409);
        if (err.code === "P2025") return fail("We couldn't find that item.", 404);
      }
      console.error("[api]", err);
      return fail("Something went wrong on our side. Please try again.", 500);
    }
  };
}

export type IdParams = { params: Promise<{ id: string }> };
