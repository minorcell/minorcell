'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'

type RouteBackState = {
  lastPathname: string | null
  previousPathname: string | null
}

let routeBackState: RouteBackState = {
  lastPathname: null,
  previousPathname: null,
}

const listeners = new Set<() => void>()

const routeLabelMap: Record<string, string> = {
  blog: '文章',
  projects: '项目',
  topics: '专题',
}

const fallbackPathMap: Record<string, string> = {
  blog: '/blog',
  projects: '/projects',
  topics: '/topics',
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((listener) => listener())
}

function getSnapshot() {
  return routeBackState
}

function getServerSnapshot() {
  return routeBackState
}

function updateRouteBackState(pathname: string) {
  if (routeBackState.lastPathname === pathname) {
    return
  }

  routeBackState = {
    previousPathname: routeBackState.lastPathname,
    lastPathname: pathname,
  }
  emit()
}

function getPathLabel(pathname: string | null) {
  if (!pathname) return null
  if (pathname === '/') return '首页'

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return '首页'

  const firstSegment = segments[0]
  if (routeLabelMap[firstSegment]) {
    return routeLabelMap[firstSegment]
  }

  const lastSegment = segments[segments.length - 1]
  return decodeURIComponent(lastSegment).replace(/[-_]/g, ' ')
}

function getFallbackPath(pathname: string) {
  if (pathname === '/') return '/'

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return '/'

  if (segments.length === 1) {
    return '/'
  }

  const firstSegment = segments[0]
  if (fallbackPathMap[firstSegment]) {
    return fallbackPathMap[firstSegment]
  }

  return `/${firstSegment}`
}

function isTopLevelSection(pathname: string) {
  return pathname === '/blog' || pathname === '/projects' || pathname === '/topics'
}

function canUseBrowserBack(previousPathname: string | null) {
  return typeof window !== 'undefined' && window.history.length > 1 && previousPathname !== null
}

export function useRouteBack() {
  const pathname = usePathname()
  const router = useRouter()
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    updateRouteBackState(pathname)
  }, [pathname])

  const previousPathname =
    state.lastPathname && state.lastPathname !== pathname
      ? state.lastPathname
      : state.previousPathname
  const fallbackPath = getFallbackPath(pathname)
  const previousLabel = getPathLabel(
    isTopLevelSection(pathname) ? fallbackPath : previousPathname ?? fallbackPath,
  )

  // Show back button only on detail pages (2+ path segments),
  // not on home or top-level section pages like /blog, /projects, /topics.
  const segmentCount = pathname.split('/').filter(Boolean).length
  const shouldShowBackButton = segmentCount >= 2

  return {
    previousPathname,
    previousLabel,
    shouldShowBackButton,
    goBack: () => {
      if (canUseBrowserBack(previousPathname)) {
        router.back()
        return
      }

      router.push(fallbackPath)
    },
  }
}
