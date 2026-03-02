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
import { Card, CardContent } from '@/components/ui/card'
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

  if (url.port && !['80', '443'].includes(url.port)) {
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

  if (url.href.length > 180) {
    risks.push({
      level: 'low',
      label: '链接较长',
      detail: '超长链接可能用于隐藏真实参数，请留意域名和路径。',
    })
  }

  return risks
}

const getRiskBadgeClasses = (level: LinkRiskLevel) => {
  if (level === 'high') {
    return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/35'
  }
  if (level === 'medium') {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/35'
  }
  return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/35'
}

const getRiskLabel = (level: LinkRiskLevel) => {
  if (level === 'high') return '高风险'
  if (level === 'medium') return '中风险'
  return '提示'
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
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

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
    const timeoutId = window.setTimeout(() => controller.abort(), 4500)

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
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>即将离开本站</AlertDialogTitle>
          <AlertDialogDescription>
            请在继续前确认目标地址是否可信。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  目标链接
                </p>
                <p className="break-all text-sm text-foreground">
                  {pendingLink?.href}
                </p>
                <p className="text-xs text-muted-foreground">
                  站点：{destinationHost || '未知'}
                  {pendingLink?.target === '_blank' ? ' · 新标签页打开' : ''}
                </p>
              </div>

              {showSeoSection && (
                <div className="border-t border-border/70 pt-3">
                  {preview.status === 'loading' && (
                    <div className="mt-2 space-y-2 animate-pulse">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-5/6 rounded bg-muted" />
                    </div>
                  )}

                  {preview.status === 'ready' && preview.data && (
                    <div className="mt-2 flex gap-3">
                      {preview.data.image && (
                        // eslint-disable-next-line @next/next/no-img-element -- preview image source is dynamic and external.
                        <img
                          src={preview.data.image}
                          alt="站点预览图"
                          className="h-16 w-16 rounded-md object-cover border border-border"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-foreground break-words">
                          {preview.data.title ||
                            preview.data.siteName ||
                            destinationHost}
                        </p>
                        {preview.data.description && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {preview.data.description}
                          </p>
                        )}
                        {(preview.data.siteName || preview.data.canonicalUrl) && (
                          <p className="text-xs text-muted-foreground break-all">
                            {preview.data.siteName || preview.data.canonicalUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {risks.length > 0 && (
            <Card
              className={cn(
                hasHighRisk
                  ? 'border-red-500/35 bg-red-500/5'
                  : 'border-amber-500/35 bg-amber-500/5',
              )}
            >
              <CardContent className="p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  风险提示
                </p>
                <ul className="space-y-2">
                  {risks.map((risk, index) => (
                    <li key={`${risk.label}-${index}`} className="flex gap-2">
                      <span
                        className={cn(
                          'inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-medium shrink-0',
                          getRiskBadgeClasses(risk.level),
                        )}
                      >
                        {getRiskLabel(risk.level)}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm text-foreground">{risk.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {risk.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            className={
              hasHighRisk
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
            onClick={handleContinue}
          >
            {hasHighRisk ? '仍要继续访问' : '继续访问'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
