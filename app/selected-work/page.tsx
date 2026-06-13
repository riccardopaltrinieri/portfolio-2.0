import Link from "next/link"

import { ArrowLeft, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SelectedWorkCard } from "@/components/selected-work-card"
import { getPortfolioContent } from "@/lib/portfolio-content"

export default async function SelectedWorkIndexPage() {
  const content = await getPortfolioContent()

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b">
        <div className="container py-8 md:py-12">
          <Button variant="ghost" asChild className="mb-8 -ml-3">
            <Link href="/#projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>

          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Selected Work
            </div>
            <h1 className="text-4xl font-bold tracking-tighter md:text-6xl">{content.selectedWork.title}</h1>
            <p className="text-lg leading-8 text-muted-foreground md:text-xl">
              A full list of the projects and systems I want to highlight, each with its own detailed write-up.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {content.selectedWork.items.map((item) => (
            <SelectedWorkCard key={item.slug} {...item} />
          ))}
        </div>
      </section>
    </main>
  )
}
