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
    return 'bg-red-500/10 text-red-700 dark:text-red-300'
  }
  if (level === 'medium') {
    return 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
  }
  return 'bg-sky-500/10 text-sky-800 dark:text-sky-300'
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
      setPreview({ status: 'idle', data: null })
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
    if (!open || !pendingLink) return

    let active = true
    const controller = new AbortController()
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      PREVIEW_TIMEOUT_MS,
    )

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
      <AlertDialogContent className="max-w-lg gap-0 rounded-xl border-0 bg-card p-6 shadow-overlay sm:p-7">
        <AlertDialogHeader className="space-y-2 text-left">
          <AlertDialogTitle className="type-card-title m-0">
            打开外部链接？
          </AlertDialogTitle>
          <AlertDialogDescription className="type-meta m-0 text-muted-foreground">
            你将离开 Minor Cell，请确认目标地址。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-5">
          <section className="rounded-lg bg-muted px-4 py-3">
            <p className="type-meta m-0 font-medium text-foreground">
              {destinationHost || '未知地址'}
            </p>
            <p className="type-caption mb-0 mt-1 break-all font-mono text-muted-foreground">
              {pendingLink?.href}
            </p>
          </section>

          {preview.status === 'ready' && preview.data ? (
            <section className="mt-4 flex gap-3 px-1">
              {preview.data.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview image source is dynamic and external.
                <img
                  src={preview.data.image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0">
                <p className="type-meta m-0 font-medium text-foreground">
                  {preview.data.title ||
                    preview.data.siteName ||
                    destinationHost}
                </p>
                {preview.data.description ? (
                  <p className="type-caption mb-0 mt-1 line-clamp-2 text-muted-foreground">
                    {preview.data.description}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {risks.length > 0 ? (
            <section className="mt-4 space-y-2">
              {risks.map((risk, index) => (
                <div
                  key={`${risk.label}-${index}`}
                  className={cn(
                    'rounded-md px-3 py-2.5',
                    getRiskTone(risk.level),
                  )}
                >
                  <p className="type-caption m-0 font-semibold">{risk.label}</p>
                  <p className="type-caption mb-0 mt-0.5 opacity-80">
                    {risk.detail}
                  </p>
                </div>
              ))}
            </section>
          ) : null}
        </div>

        <AlertDialogFooter className="mt-6 flex-row items-center justify-end gap-2">
          <AlertDialogCancel className="m-0 h-9 border-0 bg-muted px-4 shadow-none hover:bg-muted/80">
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleContinue}
            className={cn(
              'm-0 h-9 border-0 px-4 shadow-none',
              hasHighRisk
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary text-primary-foreground hover:bg-accent-foreground',
            )}
          >
            {hasHighRisk ? '仍要继续' : '继续访问'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
