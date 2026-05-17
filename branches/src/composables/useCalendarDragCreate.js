import { ref, onUnmounted, nextTick } from 'vue'
import { snapTo15Minutes } from './useCalendarEvents'

const DRAG_THRESHOLD_PX = 8
export const GRID_INTERVAL_MINUTES = 15
export const GRID_INTERVAL_HEIGHT = 48
const MINUTES_PER_DAY = 24 * 60

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function minutesToDateTime(dateStr, minutes) {
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

/** Match Qalendar week config: startsOn Sunday */
export function getWeekStart(dateLike) {
  if (!dateLike) return null
  const t = new Date(dateLike)
  if (Number.isNaN(t.getTime())) return null
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** Qalendar does not emit updated-period on first mount; seed drag-create with this. */
export function buildWeekPeriod(anchorDate = new Date()) {
  const selectedDate = new Date(anchorDate)
  const start = getWeekStart(selectedDate)
  if (!start) {
    return { start: selectedDate, end: selectedDate, selectedDate }
  }
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end, selectedDate }
}

function getWeekDayDate(dayEl, dayIndex, period) {
  const anchor = period?.start ?? period?.selectedDate ?? new Date()
  const weekStart = getWeekStart(anchor)
  if (!weekStart) return parseDayId(dayEl)

  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayIndex)
  return formatDate(d)
}

function getWeekDayColumns(wrapperEl) {
  const root = wrapperEl?.closest?.('.calendar-week__wrapper')
  if (!root) return []
  return Array.from(root.querySelectorAll('.calendar-week .calendar-week__day'))
}

/** Snap a vertical position to the 15-minute grid within a day column */
function getSnappedDragRange(dayEl, y1, y2) {
  const height = dayEl.clientHeight || 1
  const intervalCount = MINUTES_PER_DAY / GRID_INTERVAL_MINUTES
  const intervalHeight = height / intervalCount

  const topY = Math.min(y1, y2)
  const bottomY = Math.max(y1, y2)

  let startIndex = Math.floor(topY / intervalHeight)
  let endIndex = Math.ceil(bottomY / intervalHeight)

  if (endIndex <= startIndex) {
    endIndex = startIndex + 1
  }

  startIndex = Math.max(0, Math.min(intervalCount - 1, startIndex))
  endIndex = Math.min(intervalCount, endIndex)

  return {
    topOffsetY: startIndex * intervalHeight,
    heightPx: (endIndex - startIndex) * intervalHeight,
    startMinutes: startIndex * GRID_INTERVAL_MINUTES,
    endMinutes: endIndex * GRID_INTERVAL_MINUTES
  }
}

function parseQalendarDateTime(str) {
  if (!str?.includes(' ')) return new Date(str + 'T00:00:00')
  const [date, time] = str.split(' ')
  return new Date(`${date}T${time}:00`)
}

export function useCalendarDragCreate({ wrapperRef, getPeriod, onRangeSelected }) {
  const dragPreview = ref(null)
  let dragState = null
  let suppressClick = false
  let listenersAttached = false

  const clearPreview = () => {
    dragPreview.value = null
  }

  const updateWeekPreview = (dayEl, startY, currentY) => {
    const wrapper = wrapperRef.value
    if (!wrapper) return

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

  const finishDrag = (endEvent) => {
    if (!dragState) return

    const state = dragState
    dragState = null
    document.body.style.userSelect = ''
    document.body.style.cursor = ''

    let startStr = state.startStr
    let endStr = state.endStr
    let allDay = state.allDay

    if (state.type === 'week') {
      const dayEl = state.dayEl
      const rect = dayEl.getBoundingClientRect()
      const endY = Math.max(0, Math.min(rect.height, endEvent.clientY - rect.top))

      const moved = Math.abs(endEvent.clientY - state.startClientY) >= DRAG_THRESHOLD_PX
      if (!moved) {
        clearPreview()
        return
      }

      const period = getPeriod()
      const dateStr = getWeekDayDate(dayEl, state.dayIndex, period)
      if (!dateStr) {
        clearPreview()
        return
      }

      const range = getSnappedDragRange(dayEl, state.startY, endY)
      startStr = minutesToDateTime(dateStr, range.startMinutes)
      endStr = minutesToDateTime(dateStr, range.endMinutes)
    } else if (state.type === 'month') {
      const endDate = parseDayId(document.elementFromPoint(endEvent.clientX, endEvent.clientY))
      if (!endDate || !state.startDate) {
        clearPreview()
        return
      }
      if (endDate === state.startDate && !state.moved) {
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
      const startDay = startStr.slice(0, 10)
      const endDay = endStr.slice(0, 10)
      onRangeSelected({ start: startDay, end: endDay, allDay: true })
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

    suppressClick = true
    setTimeout(() => { suppressClick = false }, 300)
  }

  const onPointerMove = (e) => {
    if (!dragState) return

    if (dragState.type === 'week') {
      const dayEl = dragState.dayEl
      const rect = dayEl.getBoundingClientRect()
      const currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
      const range = updateWeekPreview(dayEl, dragState.startY, currentY)

      const period = getPeriod()
      const dateStr = getWeekDayDate(dayEl, dragState.dayIndex, period)
      if (dateStr && range) {
        dragState.endStr = minutesToDateTime(dateStr, range.endMinutes)
        dragState.startStr = minutesToDateTime(dateStr, range.startMinutes)
      }
    } else if (dragState.type === 'month') {
      dragState.moved = dragState.moved ||
        Math.abs(e.clientX - dragState.startClientX) > DRAG_THRESHOLD_PX ||
        Math.abs(e.clientY - dragState.startClientY) > DRAG_THRESHOLD_PX
    }
  }

  const onPointerUp = (e) => {
    if (!dragState) return
    finishDrag(e)
  }

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('.calendar-week__event, .calendar-month__event')) return

    const weekDay = e.target.closest('.calendar-week__day')
    if (weekDay) {
      e.preventDefault()
      e.stopPropagation()

      const days = getWeekDayColumns(weekDay)
      const dayIndex = days.indexOf(weekDay)
      const period = getPeriod()
      const dateStr = getWeekDayDate(weekDay, dayIndex, period)
      if (!dateStr) return

      const rect = weekDay.getBoundingClientRect()
      const startY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
      const range = getSnappedDragRange(weekDay, startY, startY)

      const wrapper = wrapperRef.value
      const wrapperRect = wrapper.getBoundingClientRect()
      const dayRect = weekDay.getBoundingClientRect()

      dragState = {
        type: 'week',
        dayEl: weekDay,
        dayIndex,
        startY,
        startStr: minutesToDateTime(dateStr, range.startMinutes),
        endStr: minutesToDateTime(dateStr, range.endMinutes),
        startClientY: e.clientY,
        previewLeft: dayRect.left - wrapperRect.left + wrapper.scrollLeft,
        previewWidth: dayRect.width
      }

      updateWeekPreview(weekDay, startY, startY)

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'crosshair'
      return
    }

    const monthDay = e.target.closest('.calendar-month__weekday')
    if (monthDay) {
      const startDate = parseDayId(monthDay)
      if (!startDate) return

      e.preventDefault()
      e.stopPropagation()
      dragState = {
        type: 'month',
        startDate,
        startStr: startDate,
        endStr: startDate,
        allDay: true,
        moved: false,
        startClientX: e.clientX,
        startClientY: e.clientY
      }
      document.body.style.userSelect = 'none'
    }
  }

  const onClickCapture = (e) => {
    if (e.target.closest('.calendar-week__event, .calendar-month__event')) return
    if (suppressClick || dragState) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  const attach = () => {
    const el = wrapperRef.value
    if (!el) return false
    if (listenersAttached) return true
    el.addEventListener('pointerdown', onPointerDown, true)
    el.addEventListener('click', onClickCapture, true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    listenersAttached = true
    return true
  }

  const ensureAttach = async () => {
    await nextTick()
    return attach()
  }

  const detach = () => {
    const el = wrapperRef.value
    if (el) {
      el.removeEventListener('pointerdown', onPointerDown, true)
      el.removeEventListener('click', onClickCapture, true)
    }
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    listenersAttached = false
    dragState = null
    clearPreview()
  }

  onUnmounted(detach)

  return {
    dragPreview,
    attach,
    ensureAttach,
    detach
  }
}
