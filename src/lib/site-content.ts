import siteJson from '../../content/site/site.json'

export interface SiteSection {
  label: string
  path: string
  description?: string
}

export interface SiteContent {
  name: string
  title: string
  url: string
  locale: string
  subtitle: string
  description: string
  keywords: string[]
  sections: SiteSection[]
  profile: {
    location: string
    roles: string[]
  }
  contact: {
    github?: string
    email?: string
    bilibili?: string
    juejin?: string
  }
}

export const siteContent = siteJson as SiteContent
