import { ref, onUnmounted, nextTick } from 'vue'
import { snapTo15Minutes } from './useCalendarEvents'
import {
  GRID_INTERVAL_MINUTES,
  getWeekDayColumns,
  getWeekDayDate,
  getSnappedDragRange
} from './useCalendarDragCreate'

const LONG_PRESS_MS = 3000
const MOVE_CANCEL_PX = 12
const SCROLL_EDGE_PX = 80
const MAX_SCROLL_SPEED = 6

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function minutesToDateTime(dateStr, minutes) {
  const MINUTES_PER_DAY = 24 * 60
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY - GRID_INTERVAL_MINUTES, minutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${dateStr} ${pad(h)}:${pad(m)}`
}

function formatQalendarDateTime(date) {
  const d = snapTo15Minutes(date)
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseDayId(el) {
  const dayCell = el?.closest?.('[id^="day-"]')
  if (!dayCell?.id) return null
  return dayCell.id.replace('day-', '')
}

function parseQalendarDateTime(str) {
  if (!str?.includes(' ')) return new Date(str + 'T00:00:00')
  const [date, time] = str.split(' ')
  return new Date(`${date}T${time}:00`)
}

function touchPoint(touch) {
  return { clientX: touch.clientX, clientY: touch.clientY }
}

export function useCalendarTouchDragCreate({
  wrapperRef,
  getPeriod,
  getScrollEl,
  onRangeSelected,
  longPressMs = LONG_PRESS_MS
}) {
  const dragPreview = ref(null)
  const touchHoldIndicator = ref(null)

  let listenersAttached = false
  let longPressTimer = null
  let holdProgressTimer = null
  let pendingTouch = null
  let dragState = null
  let autoScrollRaf = null
  let lastTouchY = 0

  const clearPreview = () => {
    dragPreview.value = null
  }

  const clearHoldIndicator = () => {
    touchHoldIndicator.value = null
  }

  const stopAutoScroll = () => {
    if (autoScrollRaf != null) {
      cancelAnimationFrame(autoScrollRaf)
      autoScrollRaf = null
    }
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
    pendingTouch = null
    clearHoldIndicator()
  }

  const getWrapper = () => wrapperRef.value

  const updateHoldIndicator = (clientX, clientY, progress) => {
    const wrapper = getWrapper()
    if (!wrapper) return
    const rect = wrapper.getBoundingClientRect()
    touchHoldIndicator.value = {
      left: `${clientX - rect.left + wrapper.scrollLeft}px`,
      top: `${clientY - rect.top + wrapper.scrollTop}px`,
      '--hold-progress': String(Math.min(1, Math.max(0, progress)))
    }
  }

  const updateWeekPreview = (dayEl, startY, currentY) => {
    const wrapper = getWrapper()
    if (!wrapper || !dragState) return null

    const range = getSnappedDragRange(dayEl, startY, currentY)
    const wrapperRect = wrapper.getBoundingClientRect()
    const dayRect = dayEl.getBoundingClientRect()

    dragPreview.value = {
      top: `${dayRect.top - wrapperRect.top + wrapper.scrollTop + range.topOffsetY}px`,
      height: `${range.heightPx}px`,
      left: `${dragState.previewLeft}px`,
      width: `${dragState.previewWidth}px`
    }

    return range
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

    if (dragState.type === 'week') {
      const dayEl = dragState.dayEl
      const rect = dayEl.getBoundingClientRect()
      const currentY = Math.max(0, Math.min(rect.height, lastTouchY - rect.top))
      const range = updateWeekPreview(dayEl, dragState.startY, currentY)
      const period = getPeriod()
      const dateStr = getWeekDayDate(dayEl, dragState.dayIndex, period)
      if (dateStr && range) {
        dragState.endStr = minutesToDateTime(dateStr, range.endMinutes)
        dragState.startStr = minutesToDateTime(dateStr, range.startMinutes)
      }
    }

    autoScrollRaf = requestAnimationFrame(tickAutoScroll)
  }

  const startAutoScroll = () => {
    stopAutoScroll()
    autoScrollRaf = requestAnimationFrame(tickAutoScroll)
  }

  const activateWeekDrag = () => {
    const weekDay = pendingTouch?.weekDay
    if (!weekDay || !pendingTouch) return

    const days = getWeekDayColumns(weekDay)
    const dayIndex = days.indexOf(weekDay)
    const period = getPeriod()
    const dateStr = getWeekDayDate(weekDay, dayIndex, period)
    if (!dateStr) return

    const rect = weekDay.getBoundingClientRect()
    const startY = Math.max(0, Math.min(rect.height, pendingTouch.clientY - rect.top))
    const range = getSnappedDragRange(weekDay, startY, startY)

    const wrapper = getWrapper()
    const wrapperRect = wrapper.getBoundingClientRect()
    const dayRect = weekDay.getBoundingClientRect()

    dragState = {
      type: 'week',
      dayEl: weekDay,
      dayIndex,
      startY,
      startStr: minutesToDateTime(dateStr, range.startMinutes),
      endStr: minutesToDateTime(dateStr, range.endMinutes),
      previewLeft: dayRect.left - wrapperRect.left + wrapper.scrollLeft,
      previewWidth: dayRect.width
    }

    lastTouchY = pendingTouch.clientY
    updateWeekPreview(weekDay, startY, startY)
    clearHoldIndicator()
    pendingTouch = null

    if (navigator.vibrate) {
      navigator.vibrate(20)
    }

    startAutoScroll()
  }

  const activateMonthDrag = () => {
    if (!pendingTouch?.monthDay) return
    const startDate = parseDayId(pendingTouch.monthDay)
    if (!startDate) return

    dragState = {
      type: 'month',
      startDate,
      startStr: startDate,
      endStr: startDate,
      allDay: true,
      moved: false,
      startClientX: pendingTouch.clientX,
      startClientY: pendingTouch.clientY
    }

    clearHoldIndicator()
    pendingTouch = null

    if (navigator.vibrate) {
      navigator.vibrate(20)
    }
  }

  const beginLongPress = (touch, target) => {
    cancelPendingLongPress()

    const weekDay = target.closest('.calendar-week__day')
    const monthDay = !weekDay ? target.closest('.calendar-month__weekday') : null
    if (!weekDay && !monthDay) return
    if (target.closest('.calendar-week__event, .calendar-month__event')) return

    const point = touchPoint(touch)
    pendingTouch = {
      ...point,
      originX: point.clientX,
      originY: point.clientY,
      weekDay: weekDay || null,
      monthDay: monthDay || null,
      startedAt: Date.now()
    }

    holdProgressTimer = window.setInterval(() => {
      if (!pendingTouch) return
      const elapsed = Date.now() - pendingTouch.startedAt
      updateHoldIndicator(pendingTouch.clientX, pendingTouch.clientY, elapsed / longPressMs)
    }, 50)

    longPressTimer = window.setTimeout(() => {
      longPressTimer = null
      if (holdProgressTimer != null) {
        clearInterval(holdProgressTimer)
        holdProgressTimer = null
      }
      if (!pendingTouch) return
      if (pendingTouch.weekDay) {
        activateWeekDrag()
      } else {
        activateMonthDrag()
      }
    }, longPressMs)
  }

  const finishDrag = (touch) => {
    if (!dragState) return

    const state = dragState
    dragState = null
    stopAutoScroll()

    let startStr = state.startStr
    let endStr = state.endStr
    let allDay = state.allDay

    if (state.type === 'week') {
      const dayEl = state.dayEl
      const rect = dayEl.getBoundingClientRect()
      const endY = Math.max(0, Math.min(rect.height, touch.clientY - rect.top))
      const range = getSnappedDragRange(dayEl, state.startY, endY)

      const period = getPeriod()
      const dateStr = getWeekDayDate(dayEl, state.dayIndex, period)
      if (!dateStr) {
        clearPreview()
        return
      }

      startStr = minutesToDateTime(dateStr, range.startMinutes)
      endStr = minutesToDateTime(dateStr, range.endMinutes)
      allDay = false
    } else if (state.type === 'month') {
      const endDate = parseDayId(document.elementFromPoint(touch.clientX, touch.clientY))
      if (!endDate || !state.startDate) {
        clearPreview()
        return
      }
      const startD = state.startDate
      const endD = endDate
      startStr = startD <= endD ? startD : endD
      endStr = startD <= endD ? endD : startD
      allDay = true
    }

    clearPreview()

    const startDate = parseQalendarDateTime(startStr)
    let endDate = parseQalendarDateTime(endStr)

    if (allDay) {
      onRangeSelected({
        start: startStr.slice(0, 10),
        end: endStr.slice(0, 10),
        allDay: true
      })
    } else {
      if (endDate <= startDate) {
        endDate = new Date(startDate.getTime() + GRID_INTERVAL_MINUTES * 60 * 1000)
      }
      onRangeSelected({
        start: formatQalendarDateTime(startDate),
        end: formatQalendarDateTime(endDate),
        allDay: false
      })
    }
  }

  const canStartGridLongPress = (target) => {
    if (target?.closest?.('.calendar-week__event, .calendar-month__event')) return false
    return !!(target?.closest?.('.calendar-week__day') || target?.closest?.('.calendar-month__weekday'))
  }

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return
    if (dragState) return
    if (!canStartGridLongPress(e.target)) return
    e.preventDefault()
    beginLongPress(e.touches[0], e.target)
  }

  const onTouchMove = (e) => {
    const touch = e.touches[0]
    if (!touch) return

    if (pendingTouch && !dragState) {
      e.preventDefault()
      const originX = pendingTouch.originX ?? pendingTouch.clientX
      const originY = pendingTouch.originY ?? pendingTouch.clientY
      const dx = touch.clientX - originX
      const dy = touch.clientY - originY
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
        cancelPendingLongPress()
        return
      }
      pendingTouch.clientX = touch.clientX
      pendingTouch.clientY = touch.clientY
      return
    }

    if (!dragState) return

    e.preventDefault()
    lastTouchY = touch.clientY

    if (dragState.type === 'week') {
      const dayEl = dragState.dayEl
      const rect = dayEl.getBoundingClientRect()
      const currentY = Math.max(0, Math.min(rect.height, touch.clientY - rect.top))
      const range = updateWeekPreview(dayEl, dragState.startY, currentY)
      const period = getPeriod()
      const dateStr = getWeekDayDate(dayEl, dragState.dayIndex, period)
      if (dateStr && range) {
        dragState.endStr = minutesToDateTime(dateStr, range.endMinutes)
        dragState.startStr = minutesToDateTime(dateStr, range.startMinutes)
      }
    } else if (dragState.type === 'month') {
      dragState.moved = dragState.moved ||
        Math.abs(touch.clientX - dragState.startClientX) > MOVE_CANCEL_PX ||
        Math.abs(touch.clientY - dragState.startClientY) > MOVE_CANCEL_PX
    }
  }

  const onTouchEnd = (e) => {
    if (dragState) {
      const touch = e.changedTouches[0]
      if (touch) finishDrag(touch)
      return
    }
    cancelPendingLongPress()
  }

  const onTouchCancel = () => {
    cancelPendingLongPress()
    dragState = null
    stopAutoScroll()
    clearPreview()
  }

  const attach = () => {
    const el = getWrapper()
    if (!el) return false
    if (listenersAttached) return true

    el.addEventListener('touchstart', onTouchStart, { passive: false })
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
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchCancel)
    }
    cancelPendingLongPress()
    dragState = null
    stopAutoScroll()
    clearPreview()
    listenersAttached = false
  }

  onUnmounted(detach)

  return {
    dragPreview,
    touchHoldIndicator,
    ensureAttach,
    detach
  }
}
