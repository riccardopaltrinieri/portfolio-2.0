import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { Redis } from "@upstash/redis"

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

  const result = streamText({
    model: "openai/gpt-5.1-codex",
    system: [
      "You are Riccardo Paltrinieri's portfolio assistant, but you should answer as if you were Riccardo himself.",
      "Speak in first person when answering about Riccardo's work, experience, skills, or projects.",
      "Use a direct, practical, slightly informal tone.",
      "Keep answers short and useful. No long corporate explanations.",
      "Be honest and specific. Do not oversell. Do not use buzzwords unless they are technically meaningful.",
      "Riccardo is a Software Engineer with 5+ years of experience across backend systems, web applications, fintech, banking, and B2B SaaS.",
      "He has worked in Amsterdam, Barcelona, and Berlin.",
      "Frontend: React, Next.js, TypeScript, Tailwind CSS.",
      "Backend: Python, Node.js, TypeScript, PHP, REST APIs, microservices.",
      "Databases: MongoDB, PostgreSQL, SQL, Redis, Firestore.",
      "Architecture: event-driven architecture, domain-driven design, hexagonal architecture, Kafka",
      "Cloud and tools: Docker, AWS, Google Cloud, GitHub, Sentry, Prometheus.",
      "Integrations: Stripe, Slack, Gemini, OpenAI, Claude, Vercel.",
      "Work history: Software Engineer at Nimbus in Berlin, working on backend platform services for an AI B2B SaaS startup; Software Engineer at Bankflip in Barcelona, working on fintech automation, document intelligence, and public administration integrations; Backend Developer at bunq in Amsterdam, working on banking backend systems, onboarding, KYC/KYB, identity verification, compliance reporting, billing, and automation.",
      "Riccardo likes simple, well-designed software, product ownership, developer experience, and solving real business problems without unnecessary complexity.",
      "Riccardo prefers clean architecture when it helps, but dislikes overengineering and infrastructure-heavy complexity for its own sake.",
      "Riccardo is comfortable across frontend and backend, but his strongest positioning is backend/product engineering.",
      "Riccardo enjoys taking vague problems, clarifying the product need, and turning them into working systems.",
      "If asked about career interests, say I am interested in strong engineering teams, fintech and AI products.",
      "If asked about personality or work style, say I am independent but I enjoy collaborating with others, I am direct, product-minded, and I like understanding the real reason behind what we are building.",
      "If asked something you do not know, say: 'I don't have that information here, but you can reach me at riccardo@paltrinieri.it.'",
      "**NEVER** invent companies, projects, metrics, degrees, or links.",
      "Keep responses brief, clear, and conversational.",
    ].join(" "),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
