import { MongoClient } from "mongodb"

import type { PortfolioContent } from "@/lib/portfolio-content"

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION ?? "content"
const CONTENT_ID = "portfolio-content"

let cachedClient: MongoClient | null = null
let cachedPromise: Promise<MongoClient> | null = null

async function getClient() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set")
  }

  if (cachedClient) return cachedClient
  if (!cachedPromise) {
    cachedPromise = new MongoClient(MONGODB_URI).connect()
  }

  cachedClient = await cachedPromise
  return cachedClient
}

async function getCollection() {
  const client = await getClient()
  return client.db().collection<PortfolioContent & { _id: string }>(MONGODB_COLLECTION)
}

export async function readContent<T = PortfolioContent>() {
  const collection = await getCollection()
  const existing = await collection.findOne({ _id: CONTENT_ID })

  if (existing) {
    const { _id, ...content } = existing
    return content as T
  }

  return null as T | null
}

export async function writeContent<T extends PortfolioContent>(content: T) {
  const collection = await getCollection()
  await collection.replaceOne({ _id: CONTENT_ID }, { _id: CONTENT_ID, ...content }, { upsert: true })
}
