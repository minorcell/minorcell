export const EXTERNAL_LINK_REQUEST_EVENT = 'external-link:request'

export type ExternalLinkRequestDetail = {
  href: string
  target?: string | null
}

export function requestExternalLink(detail: ExternalLinkRequestDetail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ExternalLinkRequestDetail>(EXTERNAL_LINK_REQUEST_EVENT, {
      detail,
    }),
  )
}
