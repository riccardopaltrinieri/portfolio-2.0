"use client"

import Link from "next/link"
import * as React from "react"
import { ArrowRight, CalendarDays, Edit3, Github, Linkedin, Lock, Mail, PencilLine, Save, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { SelectedWorkCard } from "@/components/selected-work-card"

type Content = Awaited<ReturnType<typeof import("@/lib/portfolio-content").getPortfolioContent>>

export function HomeClient({ initialContent }: { initialContent: Content }) {
  const [content, setContent] = React.useState(initialContent)
  const [editable, setEditable] = React.useState(false)
  const [unlockCount, setUnlockCount] = React.useState(0)
  const [password, setPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) setContent(data.content)
        setEditable(Boolean(data?.editable))
      })
      .catch(() => undefined)
  }, [])

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

  function updateExperience(index: number, patch: Partial<Content["about"]["experience"][number]>) {
    const nextExperience = content.about.experience.map((item, i) => (i === index ? { ...item, ...patch } : item))
    saveContent({ ...content, about: { ...content.about, experience: nextExperience } })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-bold text-xl">
            <Link href="/">{content.site.name}</Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {content.nav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground/80">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {editable ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Lock className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Superuser mode</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      <PencilLine className="h-4 w-4" />
                      Edit text directly on the page, then save per section.
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await fetch("/api/superuser/auth", { method: "DELETE" })
                        setEditable(false)
                      }}
                    >
                      Exit mode
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUnlockCount((n) => n + 1)}
                title="Hidden mode"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            )}
            <Link href={content.site.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Link href={content.site.linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Button>
            </Link>
            <Button asChild>
              <Link href={content.site.resumeUrl}>{content.site.resumeLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12 md:py-24">
        {unlockCount >= 5 && !editable ? (
          <div className="mx-auto mb-6 flex max-w-md gap-3 rounded-xl border bg-card p-4">
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

        <section className="flex flex-col items-center justify-center text-center py-12 md:py-24">
          <EditableField
            editable={editable}
            value={content.hero.headline}
            onSave={(headline) => saveContent({ ...content, hero: { ...content.hero, headline } })}
            render={(value) => <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">{value}</h1>}
          />
          <EditableField
            editable={editable}
            value={content.site.role}
            onSave={(role) => saveContent({ ...content, site: { ...content.site, role } })}
            render={(value) => <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-[700px]">{value}</p>}
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="#projects">
                {content.hero.primaryCta} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#contact">{content.hero.secondaryCta}</Link>
            </Button>
          </div>
        </section>

        <section id="about" className="py-12 md:py-24 border-t">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <EditableField
                editable={editable}
                value={content.about.title}
                onSave={(title) => saveContent({ ...content, about: { ...content.about, title } })}
                render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-4">{value}</h2>}
              />
              <div className="space-y-4 text-muted-foreground">
                {content.about.paragraphs.map((paragraph, index) => (
                  <EditableField
                    key={index}
                    editable={editable}
                    value={paragraph}
                    multiline
                    onSave={(next) =>
                      saveContent({
                        ...content,
                        about: { ...content.about, paragraphs: content.about.paragraphs.map((item, i) => (i === index ? next : item)) },
                      })
                    }
                    render={(value) => <p>{value}</p>}
                  />
                ))}
              </div>

              <div className="mt-8">
                <EditableField
                  editable={editable}
                  value={content.about.experienceTitle}
                  onSave={(experienceTitle) => saveContent({ ...content, about: { ...content.about, experienceTitle } })}
                  render={(value) => <h3 className="text-xl font-semibold mb-6">{value}</h3>}
                />
                <div className="relative space-y-10 border-l border-border pl-8">
                  {content.about.experience.map((item, index) => (
                    <div key={`${item.company}-${item.period}`} className="relative">
                      <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-background bg-foreground" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <EditableField editable={editable} value={item.role} onSave={(role) => updateExperience(index, { role })} render={(value) => <h4 className="text-2xl font-semibold tracking-tight">{value}</h4>} />
                          <EditableField editable={editable} value={item.company} onSave={(company) => updateExperience(index, { company })} render={(value) => <p className="mt-1 text-xl font-semibold text-foreground/95">{value}</p>} />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          <EditableField editable={editable} value={item.period} onSave={(period) => updateExperience(index, { period })} render={(value) => <span>{value}</span>} />
                        </span>
                      </div>
                      <EditableField
                        editable={editable}
                        value={item.description}
                        multiline
                        onSave={(description) => updateExperience(index, { description })}
                        render={(value) => <p className="mt-5 text-lg leading-8 text-muted-foreground">{value}</p>}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setUnlockCount((n) => n + 1)}
                className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-primary"
                title="Click"
              >
                <img src={content.about.image.src} alt={content.about.image.alt} className="h-full w-full object-cover" />
              </button>
            </div>
          </div>
        </section>

        <section id="skills" className="py-12 md:py-24 border-t">
          <EditableField
            editable={editable}
            value={content.skills.title}
            onSave={(title) => saveContent({ ...content, skills: { ...content.skills, title } })}
            render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-8 text-center">{value}</h2>}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {content.skills.groups.map((group, index) => (
              <SkillCard
                key={group.title}
                editable={editable}
                title={group.title}
                skills={group.skills}
                onSave={(next) =>
                  saveContent({
                    ...content,
                    skills: {
                      ...content.skills,
                      groups: content.skills.groups.map((item, i) => (i === index ? next : item)),
                    },
                  })
                }
              />
            ))}
          </div>
        </section>

        <section id="projects" className="py-12 md:py-24 border-t">
          <EditableField
            editable={editable}
            value={content.selectedWork.title}
            onSave={(title) => saveContent({ ...content, selectedWork: { ...content.selectedWork, title } })}
            render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-8 text-center">{value}</h2>}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.selectedWork.items.map((project) => (
              <SelectedWorkCard key={project.slug} {...project} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/selected-work">View All</Link>
            </Button>
          </div>
        </section>

        <section id="contact" className="py-12 md:py-24 border-t">
          <div className="mx-auto max-w-md text-center">
            <EditableField
              editable={editable}
              value={content.contact.title}
              onSave={(title) => saveContent({ ...content, contact: { ...content.contact, title } })}
              render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-4">{value}</h2>}
            />
            <EditableField
              editable={editable}
              value={content.contact.body}
              multiline
              onSave={(body) => saveContent({ ...content, contact: { ...content.contact, body } })}
              render={(value) => <p className="text-muted-foreground mb-8">{value}</p>}
            />
            <div className="flex flex-col gap-4">
              <Button className="w-full" asChild>
                <Link href={`mailto:${content.contact.email}`}>
                  <Mail className="mr-2 h-4 w-4" /> {content.contact.email}
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={content.site.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={content.site.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" /> GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

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
    </div>
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

function SkillCard({
  title,
  skills,
  editable,
  onSave,
}: {
  title: string
  skills: string[]
  editable: boolean
  onSave: (next: { title: string; skills: string[] }) => void
}) {
  return (
    <div className="rounded-lg border p-4">
      <EditableField editable={editable} value={title} onSave={(next) => onSave({ title: next, skills })} render={(value) => <h3 className="font-semibold">{value}</h3>} />
      <EditableField
        editable={editable}
        value={skills.join(", ")}
        multiline
        onSave={(next) => onSave({ title, skills: next.split(",").map((item) => item.trim()).filter(Boolean) })}
        render={(value) => <p className="mt-2 text-sm text-muted-foreground">{value}</p>}
      />
    </div>
  )
}
