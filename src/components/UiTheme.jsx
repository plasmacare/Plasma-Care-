import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import '../theme/neumorphic.css'
import '../theme/flat.css'
import '../theme/material.css'
import { installCopyGuard } from '../lib/copyGuard'

/**
 * Picks the visual style from the current page and tags <html> with it,
 * so each style's CSS only applies where it belongs:
 *   homepage           -> neumorphic   (soft UI)
 *   /portal/...        -> flat         (admin, staff, B2B, developer panels)
 *   everything else    -> material     (booking, payment, report, account, ...)
 * Renders nothing.
 */
export function uiForPath(pathname) {
  if (pathname === '/' || pathname === '') return 'neumorphic'
  if (pathname.startsWith('/portal')) return 'flat'
  return 'material'
}

export default function UiTheme() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.dataset.ui = uiForPath(pathname)
  }, [pathname])

  useEffect(() => {
    installCopyGuard()
  }, [])

  return null
}
