import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { Redis } from "@upstash/redis"

export const maxDuration = 30

const MESSAGE_LIMIT = 10
const LIMIT_REACHED_MESSAGE = "MESSAGE_LIMIT_REACHED"

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function POST(req: Request) {
  // Enforce the per-IP message limit when Redis is configured. If the
  // credentials aren't available (e.g. not yet synced locally), skip the
  // limit rather than failing the request.
  if (redis) {
    try {
      const ip = getClientIp(req)
      const key = `chat-usage:${ip}`
      const count = await redis.incr(key)
      if (count > MESSAGE_LIMIT) {
        return new Response(LIMIT_REACHED_MESSAGE, { status: 429 })
      }
    } catch (error) {
      console.log("[v0] Redis rate-limit check failed, allowing request:", error)
    }
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: "openai/gpt-5-mini",
    system: [
      "You are Riccardo Paltrinieri's friendly portfolio assistant.",
      "Alex is a Full Stack Software Engineer with 5+ years of experience.",
      "Frontend: React, Next.js, TypeScript, Tailwind CSS. Backend: Node.js, Express, Python, Django.",
      "Databases: PostgreSQL, MongoDB, Redis, Prisma. DevOps: Docker, AWS, CI/CD, Vercel.",
      "Work history: Senior Full Stack Developer at TechCorp Inc. (2022-Present), Full Stack Developer at StartupXYZ (2020-2022), Frontend Developer at Digital Agency Pro (2019-2020).",
      "Answer questions about Alex's skills, experience, and projects concisely and warmly.",
      "If asked something you don't know about Alex, suggest they reach out at alex@example.com.",
      "Keep responses brief and conversational.",
    ].join(" "),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
