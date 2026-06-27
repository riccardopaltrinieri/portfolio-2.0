"use client"

import Link from "next/link"
import * as React from "react"
import { ArrowDown, CalendarDays, Edit3, Github, Linkedin, Lock, Mail, PencilLine, Save } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { SelectedWorkCard } from "@/components/selected-work-card"
import { toast } from "@/hooks/use-toast"

type Content = NonNullable<Awaited<ReturnType<typeof import("@/lib/portfolio-content").getPortfolioContent>>>

const DEFAULT_CHAT_INTRO =
  "Ask any question about my work, experience, or background. I can answer about projects, skills, career history, and what I would bring to a team."

export function HomeClient({ initialContent }: { initialContent: Content | null }) {
  const [content, setContent] = React.useState<Content | null>(initialContent ?? null)
  const [editable, setEditable] = React.useState(false)
  const [unlockCount, setUnlockCount] = React.useState(0)
  const [password, setPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [isAtTop, setIsAtTop] = React.useState(true)
  const resumeInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) {
          setContent((prev) => {
            if (data.prompt) {
              return { ...data.content, chat: { ...(prev?.chat ?? {}), prompt: data.prompt } }
            }
            if (prev?.chat?.prompt) {
              return { ...data.content, chat: { ...(prev.chat ?? {}), prompt: prev.chat.prompt } }
            }
            return data.content
          })
        }
        setEditable(Boolean(data?.editable))
      })
      .catch(() => undefined)
  }, [])

  React.useEffect(() => {
    const updateScrollPosition = () => setIsAtTop(window.scrollY <= 8)
    updateScrollPosition()
    window.addEventListener("scroll", updateScrollPosition, { passive: true })
    return () => window.removeEventListener("scroll", updateScrollPosition)
  }, [])

  function scrollToSection(id: string) {
    const element = document.getElementById(id)
    if (!element) return

    const headerOffset = 64
    const start = window.scrollY
    const target = element.getBoundingClientRect().top + start - headerOffset
    const distance = target - start
    const duration = 650
    const startedAt = performance.now()

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, target)
      return
    }

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      window.scrollTo(0, start + distance * eased)

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

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

  async function handleResumeClick() {
    if (editable) {
      resumeInputRef.current?.click()
      return
    }

    try {
      const res = await fetch("/api/resume", { method: "HEAD", cache: "no-store" })
      if (!res.ok || res.status === 204) {
        toast({
          variant: "destructive",
          title: "Resume unavailable",
          description: "Something went wrong while loading the resume.",
        })
        return
      }

      window.open("/api/resume", "_blank", "noopener,noreferrer")
    } catch {
      toast({
        variant: "destructive",
        title: "Resume unavailable",
        description: "Something went wrong while loading the resume.",
      })
    }
  }

  async function handleResumeUpload(file: File | null) {
    if (!file) return
    const formData = new FormData()
    formData.set("file", file)
    formData.set("contentType", file.type || "application/pdf")
    formData.set("filename", file.name || "resume.pdf")
    await fetch("/api/resume", {
      method: "POST",
      body: formData,
    })
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
    if (!portfolio) return
    const nextExperience = portfolio.about.experience.map((item, i) => (i === index ? { ...item, ...patch } : item))
    saveContent({ ...portfolio, about: { ...portfolio.about, experience: nextExperience } })
  }

  const portfolio = content

  if (!portfolio) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-bold text-xl">
            <Link href="/">{portfolio.site.name}</Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {portfolio.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground/80"
                onClick={(event) => {
                  if (!item.href.startsWith("#")) return
                  event.preventDefault()
                  scrollToSection(item.href.slice(1))
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={portfolio.site.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Link href={portfolio.site.linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Button>
            </Link>
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                void handleResumeUpload(event.target.files?.[0] ?? null)
                event.currentTarget.value = ""
              }}
            />
            <Button onClick={() => void handleResumeClick()} disabled={saving}>
              {portfolio.site.resumeLabel}
            </Button>
          </div>
        </div>
      </header>

      <main className="container">
        {unlockCount >= 5 && !editable ? (
          <div className="mx-auto mb-6 flex max-w-md gap-3 rounded-xl border bg-card p-4">
            <div className="mt-1">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">Enter the superuser password.</p>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  void unlock()
                }}
              >
                  <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Access code" />
                  <Button type="submit">Unlock</Button>
              </form>
            </div>
          </div>
        ) : null}

        <section className="flex min-h-[calc(100vh-4rem)] items-center py-6 md:py-10">
          <div className="mx-auto flex max-h-[calc(100vh-7rem)] min-h-[min(680px,calc(100vh-7rem))] w-full max-w-3xl flex-col rounded-2xl bg-card p-4 md:p-5">
            <ChatAssistant
              editable={editable}
              headline={portfolio.hero.headline}
              role={portfolio.site.role}
              intro={portfolio.chat.intro ?? DEFAULT_CHAT_INTRO}
              image={portfolio.about.image}
              prompt={portfolio.chat.prompt}
              onPortraitClick={() => setUnlockCount((n) => n + 1)}
              onSaveHeadline={(headline) => saveContent({ ...portfolio, hero: { ...portfolio.hero, headline } })}
              onSaveRole={(role) => saveContent({ ...portfolio, site: { ...portfolio.site, role } })}
              onSaveIntro={(intro) => saveContent({ ...portfolio, chat: { ...portfolio.chat, intro } })}
              onSave={async (prompt) => {
                await saveContent({ ...portfolio, chat: { ...portfolio.chat, prompt } })
              }}
            />
          </div>
        </section>

        <section id="about" className="scroll-mt-16 py-12 md:py-24 border-t">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <EditableField
                editable={editable}
                value={portfolio.about.title}
                onSave={(title) => saveContent({ ...portfolio, about: { ...portfolio.about, title } })}
                render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-4">{value}</h2>}
              />
              <div className="space-y-4 text-muted-foreground">
                {portfolio.about.paragraphs.map((paragraph, index) => (
                  <EditableField
                    key={index}
                    editable={editable}
                    value={paragraph}
                    multiline
                    onSave={(next) =>
                      saveContent({
                        ...portfolio,
                        about: { ...portfolio.about, paragraphs: portfolio.about.paragraphs.map((item, i) => (i === index ? next : item)) },
                      })
                    }
                    render={(value) => <p>{value}</p>}
                  />
                ))}
              </div>

              <div className="mt-8">
                <EditableField
                  editable={editable}
                  value={portfolio.about.experienceTitle}
                  onSave={(experienceTitle) => saveContent({ ...portfolio, about: { ...portfolio.about, experienceTitle } })}
                  render={(value) => <h3 className="text-xl font-semibold mb-6">{value}</h3>}
                />
                <div className="relative space-y-10 border-l border-border pl-8">
                  {portfolio.about.experience.map((item, index) => (
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
          </div>
        </section>

        <section id="skills" className="scroll-mt-16 py-12 md:py-24 border-t">
          <EditableField
            editable={editable}
            value={portfolio.skills.title}
            onSave={(title) => saveContent({ ...portfolio, skills: { ...portfolio.skills, title } })}
            render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-8 text-center">{value}</h2>}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {portfolio.skills.groups.map((group, index) => (
              <SkillCard
                key={group.title}
                editable={editable}
                title={group.title}
                skills={group.skills}
                onSave={(next) =>
                  saveContent({
                    ...portfolio,
                    skills: {
                      ...portfolio.skills,
                      groups: portfolio.skills.groups.map((item, i) => (i === index ? next : item)),
                    },
                  })
                }
              />
            ))}
          </div>
        </section>

        <section id="projects" className="scroll-mt-16 py-12 md:py-24 border-t">
          <EditableField
            editable={editable}
            value={portfolio.selectedWork.title}
            onSave={(title) => saveContent({ ...portfolio, selectedWork: { ...portfolio.selectedWork, title } })}
            render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-8 text-center">{value}</h2>}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portfolio.selectedWork.items.slice(0, 3).map((project) => (
              <SelectedWorkCard key={project.slug} {...project} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/selected-work">View All</Link>
            </Button>
          </div>
        </section>

        <section id="contact" className="scroll-mt-16 py-12 md:py-24 border-t">
          <div className="mx-auto max-w-md text-center">
            <EditableField
              editable={editable}
              value={portfolio.contact.title}
              onSave={(title) => saveContent({ ...portfolio, contact: { ...portfolio.contact, title } })}
              render={(value) => <h2 className="text-3xl font-bold tracking-tighter mb-4">{value}</h2>}
            />
            <EditableField
              editable={editable}
              value={portfolio.contact.body}
              multiline
              onSave={(body) => saveContent({ ...portfolio, contact: { ...portfolio.contact, body } })}
              render={(value) => <p className="text-muted-foreground mb-8">{value}</p>}
            />
            <div className="flex flex-col gap-4">
              <Button className="w-full" asChild>
                <Link href={`mailto:${portfolio.contact.email}`}>
                  <Mail className="mr-2 h-4 w-4" /> {portfolio.contact.email}
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={portfolio.site.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={portfolio.site.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" /> GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {isAtTop ? (
        <button
          type="button"
          className="fixed bottom-5 left-1/2 z-40 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg ring-1 ring-black/10 transition hover:bg-zinc-100 md:hidden"
          aria-label="Scroll to about section"
          onClick={() => scrollToSection("about")}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      ) : null}

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

function ChatAssistant({
  editable,
  headline,
  role,
  intro,
  image,
  prompt,
  onPortraitClick,
  onSaveHeadline,
  onSaveRole,
  onSaveIntro,
  onSave,
}: {
  editable: boolean
  headline: string
  role: string
  intro: string
  image: {
    src: string
    alt: string
  }
  prompt: string
  onPortraitClick: () => void
  onSaveHeadline: (headline: string) => void | Promise<void>
  onSaveRole: (role: string) => void | Promise<void>
  onSaveIntro: (intro: string) => void | Promise<void>
  onSave: (prompt: string) => void | Promise<void>
}) {
  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const [draft, setDraft] = React.useState("")
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const seededRef = React.useRef(false)

  React.useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    setMessages((current) => current ?? [])
  }, [setMessages])

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const submitDraft = async () => {
    if (status === "streaming") return
    const message = draft.trim()
    if (!message) return
    setDraft("")
    await sendMessage({ text: message })
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col text-left">
      {editable ? (
        <div className="mb-4 w-full rounded-2xl border bg-card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Chat prompt</p>
          <InlinePromptEditor prompt={prompt} onSave={onSave} />
        </div>
      ) : null}
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <button
          type="button"
          onClick={onPortraitClick}
          className="mx-auto mb-5 block h-48 w-48 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          title="Click"
        >
          <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
        </button>
        <div className="max-w-[85%]">
          <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm leading-6 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50">
            <EditableField editable={editable} value={headline} onSave={onSaveHeadline} render={(value) => <>{value}</>} />
          </div>
        </div>
        <div className="max-w-[85%]">
          <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm leading-6 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50">
            <EditableField editable={editable} value={role} onSave={onSaveRole} render={(value) => <>{value}</>} />
          </div>
        </div>
        <div className="max-w-[85%]">
          <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm leading-6 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50">
            <EditableField editable={editable} value={intro} onSave={onSaveIntro} multiline render={(value) => <>{value}</>} />
          </div>
        </div>
        {messages.map((message: { parts: any[]; id: React.Key | null | undefined; role: string }) => {
          const text = message.parts
            .map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
            .join("")
            .trim()

          return (
            <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}>
              <div
                className={[
                  message.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50",
                  "whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6",
                ].join(" ")}
              >
                {text}
              </div>
            </div>
          )
        })}
        {error ? <p className="text-sm text-destructive">Chat is unavailable right now.</p> : null}
      </div>
      {!editable ? (
        <form
          className="mt-4 flex w-full items-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault()
            await submitDraft()
          }}
        >
          <Textarea
            className="min-h-10 flex-1 resize-none text-sm leading-6"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void submitDraft()
              }
            }}
            placeholder="Ask me something..."
            aria-label="Chat message"
            rows={1}
          />
          <Button type="submit" disabled={status === "streaming" || !draft.trim()}>
            Send
          </Button>
        </form>
      ) : null}
    </div>
  )
}

function InlinePromptEditor({
  prompt,
  onSave,
}: {
  prompt: string
  onSave: (prompt: string) => void | Promise<void>
}) {
  const [draft, setDraft] = React.useState(prompt)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setDraft(prompt)
  }, [prompt])

  return (
    <div className="w-full space-y-3">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={10}
        className="block min-h-40 w-full resize-y text-sm leading-6"
        aria-label="Chat prompt"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={saving || draft === prompt}
          onClick={async () => {
            setSaving(true)
            try {
              await onSave(draft)
            } finally {
              setSaving(false)
            }
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save prompt"}
        </Button>
      </div>
    </div>
  )
}

function EditableField({
  editable,
  value,
  onSave,
  render,
  multiline,
  align = "left",
}: {
  editable: boolean
  value: string
  onSave: (next: string) => void | Promise<void>
  render: (value: string) => React.ReactNode
  multiline?: boolean
  align?: "left" | "center"
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
        className={[
          "group w-full rounded-md transition-colors hover:bg-muted/40",
          align === "center" ? "text-center" : "text-left",
        ].join(" ")}
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
