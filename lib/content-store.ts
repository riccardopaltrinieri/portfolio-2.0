import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

export const CONTENT_PATH = path.join(process.cwd(), "data", "portfolio-content.json")

export async function readContent<T>() {
  const raw = await readFile(CONTENT_PATH, "utf8")
  return JSON.parse(raw) as T
}

export async function writeContent<T>(content: T) {
  await mkdir(path.dirname(CONTENT_PATH), { recursive: true })
  await writeFile(CONTENT_PATH, JSON.stringify(content, null, 2) + "\n", "utf8")
}
