import { readContent } from "@/lib/content-store"

export type PortfolioContent = {
  site: {
    name: string
    role: string
    resumeLabel: string
    resumeUrl: string
    githubUrl: string
    linkedinUrl: string
  }
  nav: Array<{
    label: string
    href: string
  }>
  hero: {
    headline: string
    primaryCta: string
    secondaryCta: string
  }
  about: {
    title: string
    paragraphs: string[]
    image: {
      src: string
      alt: string
    }
    experienceTitle: string
    experience: Array<{
      role: string
      company: string
      period: string
      description: string
    }>
  }
  skills: {
    title: string
    groups: Array<{
      title: string
      skills: string[]
    }>
  }
  selectedWork: {
    title: string
    items: Array<{
      slug: string
      title: string
      summary: string
      impact: string
      tags: string[]
      overview: string
      challenge: string
      approach: string
      outcomes: string[]
    }>
  }
  contact: {
    title: string
    body: string
    email: string
  }
  chat: {
    prompt: string
  }
}

export async function getPortfolioContent() {
  return readContent<PortfolioContent>()
}
