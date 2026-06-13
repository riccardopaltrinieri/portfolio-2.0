import { notFound } from "next/navigation"

import { getPortfolioContent } from "@/lib/portfolio-content"
import { SelectedWorkClient } from "@/components/selected-work-client"

export async function generateStaticParams() {
  const content = await getPortfolioContent()
  return content.selectedWork.items.map((item) => ({
    slug: item.slug,
  }))
}

export default async function SelectedWorkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const content = await getPortfolioContent()
  const { slug } = await params
  const work = content.selectedWork.items.find((item) => item.slug === slug)

  if (!work) {
    notFound()
  }

  return <SelectedWorkClient initialContent={content} slug={slug} />
}
