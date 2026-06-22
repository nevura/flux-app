// Shared, nesting-safe body scroll lock. Multiple overlays (a BottomSheet
// opened on top of another modal, e.g. CurrencyPicker inside TransactionModal)
// each call lockBodyScroll() independently — a module-level depth counter
// ensures only the first lock applies the style changes and only the last
// unlock restores them, so an inner overlay closing never re-enables
// scrolling while an outer one is still open.
let depth = 0
let savedScrollY = 0

export function lockBodyScroll(): () => void {
  if (depth === 0) {
    savedScrollY = window.scrollY
    const html = document.documentElement
    const body = document.body
    html.style.overflow = 'hidden'
    html.style.height = '100%'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${savedScrollY}px`
    body.style.width = '100%'
  }
  depth++

  return () => {
    depth = Math.max(0, depth - 1)
    if (depth === 0) {
      const html = document.documentElement
      const body = document.body
      html.style.overflow = ''
      html.style.height = ''
      body.style.overflow = ''
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      window.scrollTo({ top: savedScrollY, behavior: 'instant' })
    }
  }
}
