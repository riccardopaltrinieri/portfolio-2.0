"use client"

import Link from "next/link"
import * as React from "react"
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Edit3, Lock, PencilLine, Save, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Content = Awaited<ReturnType<typeof import("@/lib/portfolio-content").getPortfolioContent>>

export function SelectedWorkClient({ initialContent, slug }: { initialContent: Content; slug: string }) {
  const [content, setContent] = React.useState(initialContent)
  const [editable, setEditable] = React.useState(false)
  const [unlockCount, setUnlockCount] = React.useState(0)
  const [password, setPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const work = content.selectedWork.items.find((item) => item.slug === slug)
  const workIndex = content.selectedWork.items.findIndex((item) => item.slug === slug)

  React.useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) setContent(data.content)
        setEditable(Boolean(data?.editable))
      })
      .catch(() => undefined)
  }, [])

  if (!work) return null

  async function saveContent(next: Content) {
    setSaving(true)
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error("Save failed")
      setContent(next)
    } finally {
      setSaving(false)
    }
  }

  async function unlock() {
    const res = await fetch("/api/superuser/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setEditable(true)
      setPassword("")
    }
  }

  function updateSelectedWork(patch: Partial<typeof work>) {
    const nextItems = content.selectedWork.items.map((item, index) => (index === workIndex ? { ...item, ...patch } : item))
    saveContent({ ...content, selectedWork: { ...content.selectedWork, items: nextItems } })
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b">
        <div className="container py-8 md:py-12">
          <Button variant="ghost" asChild className="mb-8 -ml-3">
            <Link href="/#projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to selected work
            </Link>
          </Button>

          {unlockCount >= 5 && !editable ? (
            <div className="mb-6 flex max-w-md gap-3 rounded-xl border bg-card p-4">
              <div className="mt-1">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">Enter the superuser password.</p>
                <div className="flex gap-2">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                  <Button onClick={unlock}>Unlock</Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Selected Work
              </div>
              <EditableField editable={editable} value={work.title} onSave={(title) => updateSelectedWork({ title })} render={(value) => <h1 className="max-w-3xl text-4xl font-bold tracking-tighter md:text-6xl">{value}</h1>} />
              <EditableField editable={editable} value={work.summary} multiline onSave={(summary) => updateSelectedWork({ summary })} render={(value) => <p className="max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">{value}</p>} />
            </div>

            <aside className="rounded-2xl border bg-card p-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Impact</p>
                  <EditableField editable={editable} value={work.impact} multiline onSave={(impact) => updateSelectedWork({ impact })} render={(value) => <p className="mt-2 text-base leading-7">{value}</p>} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Selected engagement
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stack</p>
                  <EditableField
                    editable={editable}
                    value={work.tags.join(", ")}
                    multiline
                    onSave={(tags) => updateSelectedWork({ tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })}
                    render={(value) => (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {value.split(",").map((tag) => (
                          <span key={tag.trim()} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
            <EditableField editable={editable} value={work.overview} multiline onSave={(overview) => updateSelectedWork({ overview })} render={(value) => <p className="text-muted-foreground">{value}</p>} />
          </div>
          <div className="space-y-8">
            <div className="rounded-2xl border p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Problem</p>
              <EditableField editable={editable} value={work.challenge} multiline onSave={(challenge) => updateSelectedWork({ challenge })} render={(value) => <p className="mt-3 text-lg leading-8">{value}</p>} />
            </div>

            <div className="rounded-2xl border p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Approach</p>
              <EditableField editable={editable} value={work.approach} multiline onSave={(approach) => updateSelectedWork({ approach })} render={(value) => <p className="mt-3 text-lg leading-8">{value}</p>} />
            </div>

            <div className="rounded-2xl border p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Outcomes</p>
              <ul className="mt-4 space-y-3">
                {work.outcomes.map((outcome, index) => (
                  <li key={outcome} className="flex gap-3 text-base leading-7 text-muted-foreground">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-foreground" />
                    <EditableField
                      editable={editable}
                      value={outcome}
                      onSave={(next) => {
                        const nextOutcomes = work.outcomes.map((item, i) => (i === index ? next : item))
                        updateSelectedWork({ outcomes: nextOutcomes })
                      }}
                      render={(value) => <span>{value}</span>}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container py-12 md:py-16">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">More selected work</h2>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {content.selectedWork.items
              .filter((item) => item.slug !== work.slug)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={`/selected-work/${item.slug}`}
                  className="rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-background"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {editable ? (
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/superuser/auth", { method: "DELETE" })
            setEditable(false)
          }}
          className="fixed bottom-4 right-4 rounded-full border bg-background px-4 py-2 text-sm shadow-lg transition-colors hover:bg-muted"
          title="Exit edit mode"
        >
          <span className="inline-flex items-center gap-2">
            <PencilLine className="h-4 w-4" />
            Edit mode on
            {saving ? " saving..." : ""}
          </span>
        </button>
      ) : null}
    </main>
  )
}

function EditableField({
  editable,
  value,
  onSave,
  render,
  multiline,
}: {
  editable: boolean
  value: string
  onSave: (next: string) => void | Promise<void>
  render: (value: string) => React.ReactNode
  multiline?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(value)

  React.useEffect(() => {
    setDraft(value)
  }, [value])

  if (!editable) return <>{render(value)}</>

  return (
    <>
      <button
        type="button"
        className="group w-full rounded-md text-left transition-colors hover:bg-muted/40"
        onClick={() => setOpen(true)}
      >
        <span className="relative inline-block w-full">
          <span className="pointer-events-none absolute -top-2 right-0 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            <Edit3 className="h-3 w-3" />
          </span>
          {render(value)}
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {multiline ? (
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} />
            ) : (
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
            )}
            <Button
              onClick={async () => {
                await onSave(draft)
                setOpen(false)
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
