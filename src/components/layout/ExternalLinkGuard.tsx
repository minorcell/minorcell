'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  EXTERNAL_LINK_REQUEST_EVENT,
  type ExternalLinkRequestDetail,
} from '@/lib/external-link'

type PendingLink = {
  href: string
  target: string | null
}

type LinkRiskLevel = 'high' | 'medium' | 'low'

type LinkRisk = {
  level: LinkRiskLevel
  label: string
  detail: string
}

type LinkPreview = {
  title?: string
  description?: string
  image?: string
  siteName?: string
  canonicalUrl?: string
}

type LinkPreviewState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  data: LinkPreview | null
}

const PREVIEW_ENDPOINT =
  'https://api.microlink.io/?audio=false&video=false&iframe=false&screenshot=false&meta=true&url='
const STANDARD_WEB_PORTS = new Set(['80', '443'])
const URL_LENGTH_WARN_THRESHOLD = 180
const PREVIEW_TIMEOUT_MS = 4500

const shouldSkipHref = (href: string) =>
  href.startsWith('#') ||
  href.startsWith('mailto:') ||
  href.startsWith('tel:') ||
  href.startsWith('javascript:')

const navigateTo = (href: string, target: string | null) => {
  const finalTarget = target?.trim() || '_self'
  if (finalTarget === '_self') {
    window.location.assign(href)
    return
  }
  window.open(href, finalTarget, 'noopener,noreferrer')
}

const asHttpUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  if (!value.trim()) return undefined
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href
    }
  } catch {
    return undefined
  }
  return undefined
}

const normalizePreview = (payload: unknown): LinkPreview | null => {
  if (!payload || typeof payload !== 'object') return null

  const response = payload as {
    status?: string
    data?: {
      title?: unknown
      description?: unknown
      publisher?: unknown
      url?: unknown
      image?: unknown
      logo?: unknown
    }
  }

  if (response.status !== 'success' || !response.data) return null

  const { data } = response
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description =
    typeof data.description === 'string' ? data.description.trim() : ''
  const siteName =
    typeof data.publisher === 'string' ? data.publisher.trim() : ''
  const canonicalUrl = asHttpUrl(data.url)

  const image =
    asHttpUrl(data.image) ||
    asHttpUrl((data.image as { url?: unknown } | undefined)?.url) ||
    asHttpUrl(data.logo) ||
    asHttpUrl((data.logo as { url?: unknown } | undefined)?.url)

  if (!title && !description && !siteName && !image) {
    return null
  }

  return {
    title: title || undefined,
    description: description || undefined,
    siteName: siteName || undefined,
    image,
    canonicalUrl,
  }
}

const isIpHost = (hostname: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)

const getLinkRisks = (url: URL): LinkRisk[] => {
  const risks: LinkRisk[] = []

  if (url.protocol === 'http:') {
    risks.push({
      level: 'high',
      label: 'HTTP 明文传输',
      detail: '链接未加密，数据可能被窃听或篡改，请谨慎访问。',
    })
  }

  if (url.username || url.password) {
    risks.push({
      level: 'high',
      label: '链接包含账号信息',
      detail: 'URL 中出现用户名或密码，这通常是高风险信号。',
    })
  }

  if (url.hostname.includes('xn--')) {
    risks.push({
      level: 'medium',
      label: '疑似同形字域名',
      detail: '域名包含 punycode，可能用于伪装相似站点。',
    })
  }

  if (isIpHost(url.hostname)) {
    risks.push({
      level: 'medium',
      label: '目标为 IP 地址',
      detail: '直接使用 IP 访问较少见，建议核实来源可信度。',
    })
  }

  if (url.port && !STANDARD_WEB_PORTS.has(url.port)) {
    risks.push({
      level: 'medium',
      label: '使用非常规端口',
      detail: `当前端口为 ${url.port}，并非常见 Web 端口。`,
    })
  }

  const redirectKeys = [
    'url',
    'target',
    'redirect',
    'redirect_url',
    'next',
    'dest',
    'destination',
    'continue',
  ]

  if (redirectKeys.some((key) => url.searchParams.has(key))) {
    risks.push({
      level: 'low',
      label: '链接包含跳转参数',
      detail: '参数可能将你再次跳转到其他页面，请注意最终落地地址。',
    })
  }

  if (url.href.length > URL_LENGTH_WARN_THRESHOLD) {
    risks.push({
      level: 'low',
      label: '链接较长',
      detail: '超长链接可能用于隐藏真实参数，请留意域名和路径。',
    })
  }

  return risks
}

const getRiskTone = (level: LinkRiskLevel) => {
  if (level === 'high') {
    return 'text-red-600 dark:text-red-400 border-red-500/50'
  }
  if (level === 'medium') {
    return 'text-amber-700 dark:text-amber-400 border-amber-500/50'
  }
  return 'text-sky-700 dark:text-sky-400 border-sky-500/50'
}

const getRiskLabel = (level: LinkRiskLevel) => {
  if (level === 'high') return 'HIGH RISK'
  if (level === 'medium') return 'MEDIUM RISK'
  return 'NOTICE'
}

export function ExternalLinkGuard() {
  const [open, setOpen] = useState(false)
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null)
  const [preview, setPreview] = useState<LinkPreviewState>({
    status: 'idle',
    data: null,
  })

  useEffect(() => {
    const openExternalConfirm = (nextUrl: URL, target: string | null) => {
      if (nextUrl.origin === window.location.origin) {
        navigateTo(nextUrl.href, target)
        return
      }

      setPendingLink({
        href: nextUrl.href,
        target,
      })
      setOpen(true)
    }

    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return

      const targetEl = event.target
      if (!(targetEl instanceof Element)) return

      const anchor = targetEl.closest('a')
      if (!anchor) return
      if (anchor.dataset.skipExternalConfirm === 'true') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || shouldSkipHref(href)) return

      let nextUrl: URL
      try {
        nextUrl = new URL(anchor.href, window.location.href)
      } catch {
        return
      }

      if (!['http:', 'https:'].includes(nextUrl.protocol)) return
      if (nextUrl.origin === window.location.origin) return

      event.preventDefault()
      openExternalConfirm(nextUrl, anchor.getAttribute('target'))
    }

    const onExternalRequest = (event: Event) => {
      const customEvent = event as CustomEvent<
        ExternalLinkRequestDetail | undefined
      >
      const href = customEvent.detail?.href
      if (!href || shouldSkipHref(href)) return

      let nextUrl: URL
      try {
        nextUrl = new URL(href, window.location.href)
      } catch {
        return
      }

      if (!['http:', 'https:'].includes(nextUrl.protocol)) return
      openExternalConfirm(nextUrl, customEvent.detail?.target ?? null)
    }

    document.addEventListener('click', onClickCapture, true)
    window.addEventListener(
      EXTERNAL_LINK_REQUEST_EVENT,
      onExternalRequest as EventListener,
    )
    return () => {
      document.removeEventListener('click', onClickCapture, true)
      window.removeEventListener(
        EXTERNAL_LINK_REQUEST_EVENT,
        onExternalRequest as EventListener,
      )
    }
  }, [])

  useEffect(() => {
    if (!open || !pendingLink) {
      setPreview({ status: 'idle', data: null })
      return
    }

    let active = true
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS)

    const loadPreview = async () => {
      setPreview({ status: 'loading', data: null })

      try {
        const response = await fetch(
          `${PREVIEW_ENDPOINT}${encodeURIComponent(pendingLink.href)}`,
          {
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('preview request failed')
        }

        const payload = (await response.json()) as unknown
        if (!active) return

        const normalized = normalizePreview(payload)
        setPreview({ status: 'ready', data: normalized })
      } catch {
        if (!active) return
        setPreview({ status: 'error', data: null })
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    loadPreview()

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [open, pendingLink])

  const parsedPendingUrl = useMemo(() => {
    if (!pendingLink) return null

    try {
      return new URL(pendingLink.href)
    } catch {
      return null
    }
  }, [pendingLink])

  const destinationHost = useMemo(() => {
    if (!parsedPendingUrl) return pendingLink?.href ?? ''
    return parsedPendingUrl.hostname
  }, [parsedPendingUrl, pendingLink])

  const risks = useMemo(
    () => (parsedPendingUrl ? getLinkRisks(parsedPendingUrl) : []),
    [parsedPendingUrl],
  )

  const hasHighRisk = useMemo(
    () => risks.some((risk) => risk.level === 'high'),
    [risks],
  )
  const showSeoSection =
    preview.status === 'loading' ||
    (preview.status === 'ready' && Boolean(preview.data))

  const handleContinue = () => {
    if (!pendingLink) return
    navigateTo(pendingLink.href, pendingLink.target)

    setOpen(false)
    setPendingLink(null)
    setPreview({ status: 'idle', data: null })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setPendingLink(null)
          setPreview({ status: 'idle', data: null })
        }
      }}
    >
      <AlertDialogContent className="max-w-2xl rounded-none border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] p-0 shadow-none">
        {/* Masthead */}
        <div className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:px-8">
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--link-accent)]"
            />
            EXTERNAL LINK · 外部跳转
          </span>
          <span>{hasHighRisk ? 'HIGH RISK' : 'NOTICE'}</span>
        </div>

        {/* Title block */}
        <AlertDialogHeader className="space-y-3 px-6 pt-7 pb-1 text-left sm:px-8">
          <AlertDialogTitle
            asChild
            className="m-0 text-[clamp(1.6rem,1.3rem+1.2vw,2.2rem)] leading-[1.12] tracking-[-0.02em]"
          >
            <h2
              className="text-pretty sm:text-balance"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 500,
              }}
            >
              即将离开本站
            </h2>
          </AlertDialogTitle>
          <AlertDialogDescription
            asChild
            className="m-0 text-[15px] leading-relaxed text-muted-foreground"
          >
            <p
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
              }}
            >
              请在继续前确认目标地址是否可信。
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Body */}
        <div className="px-6 pt-6 sm:px-8">
          {/* Destination block */}
          <section className="border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] pt-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              DESTINATION · 目标地址
            </p>
            <p
              className="mt-3 break-all text-[15px] leading-relaxed text-foreground"
              style={{
                fontFamily: 'var(--font-mono), monospace',
              }}
            >
              {pendingLink?.href}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              HOST · {destinationHost || 'UNKNOWN'}
              {pendingLink?.target === '_blank' ? ' · NEW TAB' : ''}
            </p>
          </section>

          {/* Preview */}
          {showSeoSection && (
            <section className="mt-6 border-t border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pt-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                PREVIEW · 站点预览
              </p>
              {preview.status === 'loading' && (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-3/4 bg-muted/70" />
                  <div className="h-3 w-full bg-muted/60" />
                  <div className="h-3 w-5/6 bg-muted/60" />
                </div>
              )}
              {preview.status === 'ready' && preview.data && (
                <div className="flex gap-4">
                  {preview.data.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- preview image source is dynamic and external.
                    <img
                      src={preview.data.image}
                      alt="站点预览图"
                      className="h-16 w-16 shrink-0 border border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 space-y-1">
                    <p
                      className="text-[15px] leading-snug tracking-[-0.005em] text-foreground"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontWeight: 500,
                      }}
                    >
                      {preview.data.title ||
                        preview.data.siteName ||
                        destinationHost}
                    </p>
                    {preview.data.description && (
                      <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                        {preview.data.description}
                      </p>
                    )}
                    {(preview.data.siteName || preview.data.canonicalUrl) && (
                      <p className="break-all font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
                        {preview.data.siteName || preview.data.canonicalUrl}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <section className="mt-6 border-t border-[color:color-mix(in_oklab,var(--border)_70%,transparent)] pt-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                RISK NOTES · 风险提示
                <span className="ml-3 text-muted-foreground/60">
                  {risks.length} ITEM{risks.length > 1 ? 'S' : ''}
                </span>
              </p>
              <ol className="m-0 list-none space-y-3 p-0">
                {risks.map((risk, index) => (
                  <li
                    key={`${risk.label}-${index}`}
                    className="flex items-start gap-4"
                  >
                    <span
                      className={cn(
                        'mt-0.5 inline-flex shrink-0 items-center border-l-2 pl-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em]',
                        getRiskTone(risk.level),
                      )}
                    >
                      {getRiskLabel(risk.level)}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="m-0 text-[15px] leading-snug text-foreground"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontWeight: 500,
                        }}
                      >
                        {risk.label}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {risk.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Footer */}
        <AlertDialogFooter className="mt-7 flex-row items-center justify-end gap-5 border-t border-[color:color-mix(in_oklab,var(--border)_85%,transparent)] px-6 py-4 sm:px-8">
          <AlertDialogCancel className="m-0 h-auto rounded-none border-0 bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground">
            取消 · CANCEL
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleContinue}
            className={cn(
              'm-0 h-auto rounded-none border-b pb-1 font-mono text-[11px] uppercase tracking-[0.22em] shadow-none transition-colors hover:opacity-100',
              'bg-transparent p-0',
              hasHighRisk
                ? 'border-red-500/60 text-red-600 hover:bg-transparent hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                : 'border-[color:var(--link-accent)] text-[color:var(--link-accent)] hover:bg-transparent hover:text-[color:var(--link-accent)] dark:text-[color:var(--link-accent)] dark:hover:text-[color:var(--link-accent)]',
            )}
          >
            {hasHighRisk ? '仍要继续 →' : '继续访问 →'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
