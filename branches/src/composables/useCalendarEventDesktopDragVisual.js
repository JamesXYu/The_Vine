import { onUnmounted, nextTick } from 'vue'

const MOVE_THRESHOLD_PX = 3

export function useCalendarEventDesktopDragVisual({ wrapperRef }) {
  let listenersAttached = false
  let dragEl = null
  let armed = false
  let originX = 0
  let originY = 0

  const getWrapper = () => wrapperRef.value

  const clearDragVisual = () => {
    if (dragEl) {
      dragEl.classList.remove('is-event-drag-editing')
    }
    dragEl = null
    armed = false
  }

  const resolveEventEl = (target) => {
    if (target?.closest?.('.calendar-week__event-resize')) return null
    return target?.closest?.('.calendar-week__event.is-editable:not(.has-disabled-dnd)') ?? null
  }

  const onMouseDown = (e) => {
    if (e.button !== 0) return
    const eventEl = resolveEventEl(e.target)
    if (!eventEl) return
    dragEl = eventEl
    armed = true
    originX = e.clientX
    originY = e.clientY
  }

  const onMouseMove = (e) => {
    if (!armed || !dragEl || e.buttons !== 1) return
    const moved = Math.hypot(e.clientX - originX, e.clientY - originY)
    if (moved < MOVE_THRESHOLD_PX) return
    dragEl.classList.add('is-event-drag-editing')
  }

  const onMouseUp = () => {
    clearDragVisual()
  }

  const attach = () => {
    const el = getWrapper()
    if (!el || listenersAttached) return false

    el.addEventListener('mousedown', onMouseDown, true)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    listenersAttached = true
    return true
  }

  const ensureAttach = async () => {
    await nextTick()
    return attach()
  }

  const detach = () => {
    const el = getWrapper()
    if (el) {
      el.removeEventListener('mousedown', onMouseDown, true)
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    clearDragVisual()
    listenersAttached = false
  }

  onUnmounted(detach)

  return { ensureAttach, detach }
}
