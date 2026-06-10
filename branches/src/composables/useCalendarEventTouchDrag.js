import { onUnmounted, nextTick } from 'vue'
import { snapTo15Minutes } from './useCalendarEvents'
import { getWeekDayColumns } from './useCalendarDragCreate'

const LONG_PRESS_MS = 3000
const MOVE_CANCEL_PX = 12
const SCROLL_EDGE_PX = 80
const MAX_SCROLL_SPEED = 6
const MINUTES_PER_DAY = 24 * 60

function pad(n) {
  return String(n).padStart(2, '0')
}

function parseQalendarDateTime(str) {
  if (!str?.includes(' ')) return new Date(str + 'T00:00:00')
  const [date, time] = str.split(' ')
  return new Date(`${date}T${time}:00`)
}

function formatQalendarDateTime(date) {
  const d = snapTo15Minutes(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function addMinutesToQalendarTime(str, deltaMinutes) {
  const d = parseQalendarDateTime(str)
  d.setMinutes(d.getMinutes() + deltaMinutes)
  return formatQalendarDateTime(d)
}

function getEventIdFromEl(el) {
  const eventEl = el?.closest?.('.calendar-week__event')
  if (!eventEl) return { eventEl: null, eventId: null }
  const ref = eventEl.getAttribute('data-ref') || ''
  if (!ref.startsWith('event-')) return { eventEl, eventId: null }
  return { eventEl, eventId: ref.replace('event-', '') }
}

function isEditableEventTarget(target) {
  if (target?.closest?.('.calendar-week__event-resize')) return false
  const { eventEl } = getEventIdFromEl(target)
  if (!eventEl) return false
  if (!eventEl.classList.contains('is-editable')) return false
  if (eventEl.classList.contains('has-disabled-dnd')) return false
  return true
}

export function useCalendarEventTouchDrag({
  wrapperRef,
  getScrollEl,
  getEventTimes,
  canEditEvent,
  onEventDragged,
  longPressMs = LONG_PRESS_MS
}) {
  let listenersAttached = false
  let longPressTimer = null
  let holdProgressTimer = null
  let pendingTouch = null
  let dragState = null
  let autoScrollRaf = null
  let lastTouchY = 0
  let lastTouchX = 0

  const getWrapper = () => wrapperRef.value

  const stopAutoScroll = () => {
    if (autoScrollRaf != null) {
      cancelAnimationFrame(autoScrollRaf)
      autoScrollRaf = null
    }
  }

  const clearEventClasses = (eventEl) => {
    if (!eventEl) return
    eventEl.classList.remove('is-event-hold-pending', 'is-event-drag-editing')
    eventEl.style.transform = ''
    eventEl.style.zIndex = ''
  }

  const cancelPendingLongPress = () => {
    if (longPressTimer != null) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    if (holdProgressTimer != null) {
      clearInterval(holdProgressTimer)
      holdProgressTimer = null
    }
    if (pendingTouch?.eventEl) {
      clearEventClasses(pendingTouch.eventEl)
    }
    pendingTouch = null
  }

  const computeDragDeltas = (clientX, clientY) => {
    const eventsContainer = dragState.dayEl?.querySelector('.calendar-week__events')
    if (!eventsContainer || !dragState) {
      return { changeInQuarters: 0, changeInDays: 0, deltaX: 0, deltaY: 0 }
    }

    const deltaY = clientY - dragState.startClientY
    const deltaX = clientX - dragState.startClientX
    const containerHeight = eventsContainer.clientHeight || 1
    const timePointsInDay = MINUTES_PER_DAY * 100 / 60
    const ratio = (deltaY / containerHeight) * 100
    const timePoints = (timePointsInDay / 100) * ratio
    const minutes = timePoints / (100 / 60)
    const changeInQuarters = minutes < 0 ? Math.ceil(minutes / 15) : Math.floor(minutes / 15)

    const dayWidth = dragState.dayEl.clientWidth || 1
    const changeInDays = deltaX < 0 ? Math.ceil(deltaX / dayWidth) : Math.floor(deltaX / dayWidth)

    return { changeInQuarters, changeInDays, deltaX, deltaY }
  }

  const applyDragVisual = (clientX, clientY) => {
    if (!dragState?.eventEl) return
    const { deltaX, deltaY } = computeDragDeltas(clientX, clientY)
    dragState.eventEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`
    dragState.eventEl.style.zIndex = '20'
  }

  const tickAutoScroll = () => {
    if (!dragState) {
      stopAutoScroll()
      return
    }

    const scrollEl = getScrollEl?.()
    if (scrollEl) {
      const rect = scrollEl.getBoundingClientRect()
      const distFromBottom = rect.bottom - lastTouchY
      const distFromTop = lastTouchY - rect.top

      if (distFromBottom < SCROLL_EDGE_PX) {
        const intensity = 1 - Math.max(0, distFromBottom) / SCROLL_EDGE_PX
        scrollEl.scrollTop += MAX_SCROLL_SPEED * intensity
      } else if (distFromTop < SCROLL_EDGE_PX) {
        const intensity = 1 - Math.max(0, distFromTop) / SCROLL_EDGE_PX
        scrollEl.scrollTop -= MAX_SCROLL_SPEED * intensity
      }
    }

    applyDragVisual(lastTouchX, lastTouchY)
    autoScrollRaf = requestAnimationFrame(tickAutoScroll)
  }

  const startAutoScroll = () => {
    stopAutoScroll()
    autoScrollRaf = requestAnimationFrame(tickAutoScroll)
  }

  const activateDrag = () => {
    if (!pendingTouch?.eventEl || !pendingTouch?.eventId) return

    const times = getEventTimes?.(pendingTouch.eventId)
    if (!times?.start || !times?.end) {
      cancelPendingLongPress()
      return
    }

    const dayEl = pendingTouch.eventEl.closest('.calendar-week__day')
    if (!dayEl) {
      cancelPendingLongPress()
      return
    }

    const days = getWeekDayColumns(dayEl)
    const dayIndex = days.indexOf(dayEl)

    pendingTouch.eventEl.classList.remove('is-event-hold-pending')
    pendingTouch.eventEl.classList.add('is-event-drag-editing')

    dragState = {
      eventEl: pendingTouch.eventEl,
      eventId: pendingTouch.eventId,
      dayEl,
      dayIndex,
      timeStart: times.start,
      timeEnd: times.end,
      startClientX: pendingTouch.clientX,
      startClientY: pendingTouch.clientY
    }

    lastTouchX = pendingTouch.clientX
    lastTouchY = pendingTouch.clientY
    pendingTouch = null

    if (navigator.vibrate) {
      navigator.vibrate(20)
    }

    startAutoScroll()
  }

  const beginLongPress = (touch, target) => {
    if (!isEditableEventTarget(target)) return

    const { eventEl, eventId } = getEventIdFromEl(target)
    if (!eventId || !canEditEvent?.(eventId)) return

    cancelPendingLongPress()

    pendingTouch = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      originX: touch.clientX,
      originY: touch.clientY,
      eventEl,
      eventId,
      startedAt: Date.now()
    }

    eventEl.classList.add('is-event-hold-pending')

    holdProgressTimer = window.setInterval(() => {
      if (!pendingTouch?.eventEl) return
      const elapsed = Date.now() - pendingTouch.startedAt
      pendingTouch.eventEl.style.setProperty('--hold-progress', String(Math.min(1, elapsed / longPressMs)))
    }, 50)

    longPressTimer = window.setTimeout(() => {
      longPressTimer = null
      if (holdProgressTimer != null) {
        clearInterval(holdProgressTimer)
        holdProgressTimer = null
      }
      activateDrag()
    }, longPressMs)
  }

  const finishDrag = (touch) => {
    if (!dragState) return

    const state = dragState
    dragState = null
    stopAutoScroll()

    const { changeInQuarters, changeInDays } = computeDragDeltas(touch.clientX, touch.clientY)
    const deltaMinutes = changeInQuarters * 15 + changeInDays * MINUTES_PER_DAY

    clearEventClasses(state.eventEl)

    if (changeInQuarters !== 0 || changeInDays !== 0) {
      const newStart = addMinutesToQalendarTime(state.timeStart, deltaMinutes)
      const newEnd = addMinutesToQalendarTime(state.timeEnd, deltaMinutes)
      onEventDragged?.({
        id: state.eventId,
        time: { start: newStart, end: newEnd }
      })
    }
  }

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return
    if (dragState) return
    if (!isEditableEventTarget(e.target)) return

    e.preventDefault()
    e.stopImmediatePropagation()
    beginLongPress(e.touches[0], e.target)
  }

  const onTouchMove = (e) => {
    const touch = e.touches[0]
    if (!touch) return

    if (pendingTouch && !dragState) {
      e.preventDefault()
      const dx = touch.clientX - pendingTouch.originX
      const dy = touch.clientY - pendingTouch.originY
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
        cancelPendingLongPress()
      }
      return
    }

    if (!dragState) return

    e.preventDefault()
    lastTouchX = touch.clientX
    lastTouchY = touch.clientY
    applyDragVisual(touch.clientX, touch.clientY)
  }

  const onTouchEnd = (e) => {
    if (dragState) {
      const touch = e.changedTouches[0]
      if (touch) finishDrag(touch)
      return
    }

    if (pendingTouch) {
      const touch = e.changedTouches[0]
      const elapsed = Date.now() - pendingTouch.startedAt
      const dx = (touch?.clientX ?? 0) - pendingTouch.originX
      const dy = (touch?.clientY ?? 0) - pendingTouch.originY
      const eventEl = pendingTouch.eventEl
      cancelPendingLongPress()
      if (touch && elapsed < longPressMs && Math.hypot(dx, dy) <= MOVE_CANCEL_PX) {
        eventEl?.click()
      }
    }
  }

  const onTouchCancel = () => {
    if (dragState) {
      clearEventClasses(dragState.eventEl)
      dragState = null
      stopAutoScroll()
      return
    }
    cancelPendingLongPress()
  }

  const attach = () => {
    const el = getWrapper()
    if (!el) return false
    if (listenersAttached) return true

    el.addEventListener('touchstart', onTouchStart, { capture: true, passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchCancel, { passive: true })
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
      el.removeEventListener('touchstart', onTouchStart, { capture: true })
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchCancel)
    }
    if (dragState) clearEventClasses(dragState.eventEl)
    cancelPendingLongPress()
    dragState = null
    stopAutoScroll()
    listenersAttached = false
  }

  onUnmounted(detach)

  return {
    ensureAttach,
    detach
  }
}
