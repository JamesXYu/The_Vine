import { getWeekStart } from './useCalendarDragCreate'

export const SCROLL_MONTH_VISIBLE_WEEKS = 5
export const SCROLL_MONTH_INITIAL_WEEKS = 78
export const SCROLL_MONTH_EXTEND_WEEKS = 26

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad(n) {
  return String(n).padStart(2, '0')
}

export function formatDateStr(dateLike) {
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(dateLike, days) {
  const d = new Date(dateLike)
  d.setDate(d.getDate() + days)
  return d
}

export function buildScrollMonthWeeks(anchorDate, totalWeeks = SCROLL_MONTH_INITIAL_WEEKS) {
  const anchorWeekStart = getWeekStart(anchorDate) || new Date(anchorDate)
  const half = Math.floor(totalWeeks / 2)
  const rangeStart = addDays(anchorWeekStart, -half * 7)
  const todayStr = formatDateStr(new Date())
  const weeks = []

  for (let w = 0; w < totalWeeks; w++) {
    const weekStart = addDays(rangeStart, w * 7)
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d)
      const dateStr = formatDateStr(date)
      days.push({
        dateStr,
        dayNum: date.getDate(),
        isToday: dateStr === todayStr
      })
    }
    weeks.push({
      weekStartStr: formatDateStr(weekStart),
      days
    })
  }

  return weeks
}

export function findWeekIndexForDate(weeks, dateStr) {
  if (!dateStr) return -1
  return weeks.findIndex((week) => week.days.some((day) => day.dateStr === dateStr))
}

export function getWeekdayLabels() {
  return WEEKDAY_LABELS
}

/** All calendar dates (YYYY-MM-DD) an event touches. */
export function getEventDateSpan(event) {
  const start = event?.time?.start || ''
  const end = event?.time?.end || start
  const startDate = start.slice(0, 10)
  const endDate = end.slice(0, 10)
  if (!startDate || !endDate) return []

  const days = []
  let cursor = new Date(`${startDate}T00:00:00`)
  const last = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime())) return []

  while (cursor <= last) {
    days.push(formatDateStr(cursor))
    cursor = addDays(cursor, 1)
  }
  return days
}

export function buildEventsByDate(events) {
  const map = new Map()
  for (const event of events || []) {
    for (const dateStr of getEventDateSpan(event)) {
      if (!map.has(dateStr)) map.set(dateStr, [])
      map.get(dateStr).push(event)
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const aTimed = a.time?.start?.includes(' ')
      const bTimed = b.time?.start?.includes(' ')
      if (aTimed !== bTimed) return aTimed ? -1 : 1
      return (a.time?.start || '').localeCompare(b.time?.start || '')
    })
  }
  return map
}

export function formatMonthEventTime(event) {
  const start = event?.time?.start
  if (!start?.includes(' ')) return ''
  const [, time] = start.split(' ')
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function periodFromWeekIndex(weeks, startWeekIndex) {
  const clamped = Math.max(0, Math.min(startWeekIndex, weeks.length - SCROLL_MONTH_VISIBLE_WEEKS))
  const first = weeks[clamped]
  const last = weeks[clamped + SCROLL_MONTH_VISIBLE_WEEKS - 1]
  if (!first || !last) return null
  const midIndex = Math.min(
    clamped + Math.floor(SCROLL_MONTH_VISIBLE_WEEKS / 2),
    weeks.length - 1
  )
  const mid = weeks[midIndex]
  const labelDateStr = mid?.days?.[3]?.dateStr || first.days[0].dateStr
  return {
    start: new Date(`${first.days[0].dateStr}T00:00:00`),
    end: new Date(`${last.days[6].dateStr}T23:59:59`),
    selectedDate: new Date(`${labelDateStr}T12:00:00`)
  }
}

export function prependScrollMonthWeeks(weeks, count = SCROLL_MONTH_EXTEND_WEEKS) {
  const firstWeekStart = weeks[0]?.days?.[0]?.dateStr
  if (!firstWeekStart) return weeks
  const rangeStart = addDays(new Date(`${firstWeekStart}T00:00:00`), -count * 7)
  const todayStr = formatDateStr(new Date())
  const newWeeks = []

  for (let w = 0; w < count; w++) {
    const weekStart = addDays(rangeStart, w * 7)
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d)
      const dateStr = formatDateStr(date)
      days.push({
        dateStr,
        dayNum: date.getDate(),
        isToday: dateStr === todayStr
      })
    }
    newWeeks.push({ weekStartStr: formatDateStr(weekStart), days })
  }

  return [...newWeeks, ...weeks]
}

export function appendScrollMonthWeeks(weeks, count = SCROLL_MONTH_EXTEND_WEEKS) {
  const lastDay = weeks[weeks.length - 1]?.days?.[6]?.dateStr
  if (!lastDay) return weeks
  const rangeStart = addDays(new Date(`${lastDay}T00:00:00`), 1)
  const todayStr = formatDateStr(new Date())
  const newWeeks = []

  for (let w = 0; w < count; w++) {
    const weekStart = addDays(rangeStart, w * 7)
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d)
      const dateStr = formatDateStr(date)
      days.push({
        dateStr,
        dayNum: date.getDate(),
        isToday: dateStr === todayStr
      })
    }
    newWeeks.push({ weekStartStr: formatDateStr(weekStart), days })
  }

  return [...weeks, ...newWeeks]
}
