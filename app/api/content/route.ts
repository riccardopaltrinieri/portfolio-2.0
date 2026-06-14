import { NextResponse } from "next/server"

import { getPortfolioContent } from "@/lib/portfolio-content"
import { writeContent } from "@/lib/content-store"
import { isAuthedRequest } from "../../../lib/superuser-auth"

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
