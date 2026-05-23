export const EXTERNAL_LINK_REQUEST_EVENT = 'external-link:request'

export type ExternalLinkRequestDetail = {
  href: string
  target?: string | null
}
