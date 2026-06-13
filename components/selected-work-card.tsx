import Link from "next/link"

type SelectedWorkCardProps = {
  slug: string
  title: string
  summary: string
  impact: string
  tags: string[]
}

export function SelectedWorkCard({
  slug,
  title,
  summary,
  impact,
  tags,
}: SelectedWorkCardProps) {
  return (
    <Link
      href={`/selected-work/${slug}`}
      className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-transform duration-200 hover:-translate-y-1 hover:border-foreground/30"
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold transition-colors group-hover:text-foreground/80">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
        </div>
        <div className="mt-auto space-y-4">
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Impact</p>
            <p className="mt-2 text-sm">{impact}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
