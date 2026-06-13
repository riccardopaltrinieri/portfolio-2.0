import { getPortfolioContent } from "@/lib/portfolio-content"
import { HomeClient } from "@/components/home-client"

export default async function HomePage() {
  const content = await getPortfolioContent()
  return <HomeClient initialContent={content} />
}
