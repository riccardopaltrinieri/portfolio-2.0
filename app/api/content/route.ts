import { NextResponse } from "next/server"
import { createHash } from "crypto"

import { getPortfolioContent } from "@/lib/portfolio-content"
import { writeContent } from "@/lib/content-store"

const COOKIE_NAME = "portfolio_superuser"

function getCookie(req: Request, name: string) {
  const header = req.headers.get("cookie")
  if (!header) return null
  const parts = header.split(";").map((part) => part.trim())
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) return decodeURIComponent(part.slice(name.length + 1))
  }
  return null
}

function isAuthedRequest(req: Request) {
  const cookie = getCookie(req, COOKIE_NAME)
  if (!cookie) return false
  const [token, signature] = cookie.split(".")
  const secret = process.env.SUPERUSER_PASSWORD ?? ""
  const expected = createHash("sha256").update(`${token}.${secret}`).digest("hex")
  return signature === expected && Boolean(secret)
}

export async function GET(req: Request) {
  const content = await getPortfolioContent()
  return NextResponse.json({ content, editable: isAuthedRequest(req) })
}

export async function PATCH(req: Request) {
  if (!isAuthedRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const content = await req.json()
  await writeContent(content)
  return NextResponse.json({ ok: true })
}
