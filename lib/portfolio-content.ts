import { readContent } from "@/lib/content-store"

export type PortfolioContent = typeof import("@/data/portfolio-content.json")

export async function getPortfolioContent() {
  return readContent<PortfolioContent>()
}
