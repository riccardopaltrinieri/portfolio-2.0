import { NextResponse } from "next/server"

import { getPortfolioContent } from "@/lib/portfolio-content"
import { writeContent } from "@/lib/content-store"
import { isAuthedRequest } from "../../../lib/superuser-auth"

export async function GET(req: Request) {
  const content = await getPortfolioContent()
  if (!content) {
    return NextResponse.json({ content: null, editable: false, prompt: null })
  }

  const { chat, ...publicContent } = content
  const editable = isAuthedRequest(req)

  return NextResponse.json({
    content: publicContent,
    editable,
    prompt: editable ? chat.prompt : null,
  })
}

export async function PATCH(req: Request) {
  if (!isAuthedRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const content = await req.json()
  await writeContent(content)
  return NextResponse.json({ ok: true })
}
