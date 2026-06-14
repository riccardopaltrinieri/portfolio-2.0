import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

import { SUPERUSER_COOKIE_NAME, signSuperuserToken } from "../../../../lib/superuser-auth"

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string }

  if (!process.env.SUPERUSER_PASSWORD || password !== process.env.SUPERUSER_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const token = randomUUID()
  const value = `${token}.${signSuperuserToken(token)}`
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SUPERUSER_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SUPERUSER_COOKIE_NAME, "", { path: "/", maxAge: 0 })
  return res
}
