import { NextResponse } from "next/server"
import { createHash, randomUUID } from "crypto"

const COOKIE_NAME = "portfolio_superuser"

function sign(token: string) {
  const secret = process.env.SUPERUSER_PASSWORD ?? ""
  return createHash("sha256").update(`${token}.${secret}`).digest("hex")
}

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string }

  if (!process.env.SUPERUSER_PASSWORD || password !== process.env.SUPERUSER_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const token = randomUUID()
  const value = `${token}.${sign(token)}`
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 })
  return res
}
