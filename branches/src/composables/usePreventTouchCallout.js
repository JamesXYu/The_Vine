/**
 * Block native long-press menus (text selection, "More actions" in Chrome/Google app)
 * on touch-interactive surfaces. Pair with user-select: none in CSS.
 */
export function usePreventTouchCallout(targetRef) {
  let blockDefault = null
  let attachedEl = null

  const onBlockDefault = (e) => {
    e.preventDefault()
  }

  const attach = () => {
    const el = targetRef.value
    if (!el || el === attachedEl) return false

    detach()
    blockDefault = onBlockDefault
    attachedEl = el
    el.addEventListener('contextmenu', blockDefault)
    el.addEventListener('selectstart', blockDefault)
    return true
  }

  const detach = () => {
    if (attachedEl && blockDefault) {
      attachedEl.removeEventListener('contextmenu', blockDefault)
      attachedEl.removeEventListener('selectstart', blockDefault)
    }
    attachedEl = null
    blockDefault = null
  }

  return { attach, detach }
}
