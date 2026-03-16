import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function LinkInterceptor() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented) return
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      if (anchor.hasAttribute('target')) return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href) return

      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return

      e.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [navigate])

  return null
}
