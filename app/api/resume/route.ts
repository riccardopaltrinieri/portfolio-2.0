import { NextResponse } from "next/server"

import { readResume, resumeExists, writeResume } from "@/lib/resume-store"
import { isAuthedRequest } from "@/lib/superuser-auth"

export async function HEAD() {
  const exists = await resumeExists()
  return new Response(null, { status: exists ? 200 : 204 })
}

export async function GET() {
  const resume = await readResume()
  if (!resume?.body) {
    return new Response(null, { status: 204 })
  }

  const body =
    typeof (resume.body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function"
      ? Buffer.from(await (resume.body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray())
      : Buffer.from(await new Response(resume.body as BodyInit).arrayBuffer())
  return new Response(body, {
    headers: {
      "Content-Type": resume.contentType ?? "application/pdf",
      "Cache-Control": "no-store",
    },
  })
}

export async function POST(req: Request) {
  if (!isAuthedRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const contentType = formData.get("contentType")
  const filename = formData.get("filename")

  await writeResume({
    file: Buffer.from(await file.arrayBuffer()),
    contentType: typeof contentType === "string" ? contentType : file.type || "application/pdf",
    filename: typeof filename === "string" ? filename : file.name || "resume.pdf",
  })
  return NextResponse.json({ ok: true })
}
