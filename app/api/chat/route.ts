import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { Redis } from "@upstash/redis"

import { getPortfolioContent } from "@/lib/portfolio-content"

export const maxDuration = 90

const MESSAGE_LIMIT = 3
const LIMIT_REACHED_MESSAGE = "MESSAGE_LIMIT_REACHED"

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
    : null

const memoryUsage = new Map<string, { count: number; expiresAt: number }>()
const MEMORY_WINDOW_MS = 60 * 60 * 1000

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
  } else {
    const ip = getClientIp(req)
    const now = Date.now()
    const entry = memoryUsage.get(ip)

    if (!entry || entry.expiresAt <= now) {
      memoryUsage.set(ip, { count: 1, expiresAt: now + MEMORY_WINDOW_MS })
    } else {
      const nextCount = entry.count + 1
      memoryUsage.set(ip, { count: nextCount, expiresAt: entry.expiresAt })
      if (nextCount > MESSAGE_LIMIT) {
        return new Response(LIMIT_REACHED_MESSAGE, { status: 429 })
      }
    }
  }

  const { messages }: { messages: UIMessage[] } = await req.json()
  const content = await getPortfolioContent()
  const prompt = content?.chat.prompt

  if (!prompt) {
    return new Response("Chat prompt is missing from Mongo content", { status: 500 })
  }

  const result = streamText({
    model: "openai/gpt-5.1-codex",
    system: prompt,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
