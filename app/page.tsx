import { getPortfolioContent } from "@/lib/portfolio-content"
import { HomeClient } from "@/components/home-client"
import { notFound } from "next/navigation"

export default async function HomePage() {
  const content = await getPortfolioContent()
  if (!content) notFound()
  return <HomeClient initialContent={content} />
}
