import { NextRequest, NextResponse } from "next/server";
import { create_jwt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { sections } = await req.json();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "JWT secret not set" }, { status: 500 });
  }
  const token = await create_jwt({ sections }, secret);
  return NextResponse.json({ token });
} 