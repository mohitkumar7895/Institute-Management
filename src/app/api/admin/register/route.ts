import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: number }).code === 11000;
}

export async function POST(request: Request) {
  try {
    let body: { username?: string; email?: string; password?: string };
    try {
      body = (await request.json()) as { username?: string; email?: string; password?: string };
    } catch {
      return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    const username = body.username?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!username || !email || !password.trim()) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email." }, { status: 400 });
    }

    try {
      await connectDB();
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : "Database connection failed.";
      console.error("[admin/register] DB_ERROR:", message);
      return NextResponse.json(
        {
          message: "Database connection failed. Please check MONGODB_URI on Vercel.",
          debug_info: message,
        },
        { status: 500 },
      );
    }

    const existing = await AdminUser.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existing) {
      return NextResponse.json(
        { message: "Username or email already taken." },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await AdminUser.create({ username, email, password: hashed });

    return NextResponse.json({ message: "Admin registered successfully." }, { status: 201 });
  } catch (error: unknown) {
    console.error("[admin/register]", error);

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { message: "Username or email already taken." },
        { status: 409 },
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const first = Object.values(error.errors)[0];
      return NextResponse.json(
        { message: first?.message ?? "Validation failed." },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        message: "Internal server error.",
        debug_info: message,
      },
      { status: 500 },
    );
  }
}
