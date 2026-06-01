<template>
  <div class="calendar-scroll-month">
    <div class="calendar-scroll-month__day-names">
      <span
        v-for="label in weekdayLabels"
        :key="label"
        class="calendar-scroll-month__day-name"
      >{{ label }}</span>
    </div>
    <div
      ref="viewportRef"
      class="calendar-scroll-month__viewport"
      @scroll="onViewportScroll"
    >
      <div ref="weeksRef" class="calendar-scroll-month__weeks">
        <div
          v-for="(week, weekIndex) in weeks"
          :key="week.weekStartStr"
          class="calendar-scroll-month__week"
          :data-week-index="weekIndex"
        >
          <div
            v-for="day in week.days"
            :key="day.dateStr"
            :id="`day-${day.dateStr}`"
            class="calendar-month__weekday calendar-scroll-month__day"
            :class="{ 'is-today': day.isToday }"
          >
            <span class="calendar-month__day-date calendar-scroll-month__day-num">{{ day.dayNum }}</span>
            <div class="calendar-scroll-month__events">
              <button
                v-for="event in eventsForDay(day.dateStr).slice(0, 3)"
                :key="event.id"
                type="button"
                class="calendar-month__event is-event"
                :class="monthEventRsvpClass(event)"
                :style="monthEventStyle(event)"
                @click.stop="$emit('select-event', event.id)"
              >
                <span
                  v-if="event.time?.start?.includes(' ')"
                  class="calendar-month__event-time"
                >{{ formatMonthEventTime(event) }}</span>
                <span class="calendar-month__event-color" aria-hidden="true"></span>
                <span class="calendar-month__event-title">{{ event.title }}</span>
              </button>
              <button
                v-if="eventsForDay(day.dateStr).length > 3"
                type="button"
                class="calendar-scroll-month__more"
                @click.stop="onMoreEvents(day.dateStr)"
              >
                +{{ eventsForDay(day.dateStr).length - 3 }} more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import {
  SCROLL_MONTH_VISIBLE_WEEKS,
  SCROLL_MONTH_EXTEND_WEEKS,
  buildScrollMonthWeeks,
  buildEventsByDate,
  findWeekIndexForDate,
  formatDateStr,
  formatMonthEventTime,
  getWeekdayLabels,
  periodFromWeekIndex,
  prependScrollMonthWeeks,
  appendScrollMonthWeeks
} from '../composables/useScrollMonthWeeks'
import { neoEventChipStyle } from '../composables/useCalendarEvents'

export default {
  name: 'CalendarScrollMonth',
  props: {
    events: {
      type: Array,
      default: () => []
    },
    colorSchemes: {
      type: Object,
      default: () => ({})
    },
    selectedDate: {
      type: Date,
      default: () => new Date()
    },
    rootRef: {
      type: Object,
      default: null
    }
  },
  emits: ['select-event', 'updated-period'],
  setup(props, { emit }) {
    const viewportRef = ref(null)
    const weeksRef = ref(null)
    const weeks = ref(buildScrollMonthWeeks(props.selectedDate))
    const weekdayLabels = getWeekdayLabels()
    const isProgrammaticScroll = ref(false)
    const suppressSelectedDateSync = shallowRef(false)
    let headerObserver = null
    let scrollRaf = null
    let lastEmittedWeekIndex = -1

    const eventsByDate = computed(() => buildEventsByDate(props.events))

    const eventsForDay = (dateStr) => eventsByDate.value.get(dateStr) || []

    const monthEventStyle = (event) => {
      const scheme = props.colorSchemes?.[event?.colorScheme]
      const bg = scheme?.backgroundColor || event?.tagColor
      const chip = neoEventChipStyle(bg)
      return {
        '--63a9bc8a': chip['--event-accent'],
        ...chip
      }
    }

    const monthEventRsvpClass = (event) => {
      const status = event?.responseStatus
      if (status === 'pending') return 'is-rsvp-pending'
      if (status === 'rejected') return 'is-rsvp-rejected'
      return null
    }

    const updateWeekRowHeight = () => {
      const viewport = viewportRef.value
      if (!viewport) return
      const rowHeight = viewport.clientHeight / SCROLL_MONTH_VISIBLE_WEEKS
      viewport.style.setProperty('--week-row-height', `${rowHeight}px`)
    }

    const getWeekRowHeight = () => {
      const viewport = viewportRef.value
      if (!viewport) return 0
      const parsed = parseFloat(viewport.style.getPropertyValue('--week-row-height'))
      if (parsed > 0) return parsed
      return viewport.clientHeight / SCROLL_MONTH_VISIBLE_WEEKS
    }

    const scrollToWeekIndex = (weekIndex, behavior = 'auto') => {
      const viewport = viewportRef.value
      if (!viewport) return
      const rowHeight = getWeekRowHeight()
      if (!rowHeight) return
      isProgrammaticScroll.value = true
      viewport.scrollTo({ top: weekIndex * rowHeight, behavior })
      requestAnimationFrame(() => {
        isProgrammaticScroll.value = false
      })
    }

    const syncPeriodFromScroll = () => {
      const viewport = viewportRef.value
      if (!viewport || isProgrammaticScroll.value) return
      const rowHeight = getWeekRowHeight()
      if (!rowHeight) return

      const weekIndex = Math.round(viewport.scrollTop / rowHeight)
      if (weekIndex === lastEmittedWeekIndex) return
      lastEmittedWeekIndex = weekIndex

      const period = periodFromWeekIndex(weeks.value, weekIndex)
      if (period) {
        suppressSelectedDateSync.value = true
        emit('updated-period', period)
        nextTick(() => { suppressSelectedDateSync.value = false })
      }
    }

    const maybeExtendWeeks = () => {
      const viewport = viewportRef.value
      if (!viewport) return
      const rowHeight = getWeekRowHeight()
      if (!rowHeight) return

      const { scrollTop, scrollHeight, clientHeight } = viewport
      const edgeThreshold = rowHeight * 2

      if (scrollTop < edgeThreshold) {
        const added = SCROLL_MONTH_EXTEND_WEEKS
        weeks.value = prependScrollMonthWeeks(weeks.value, added)
        isProgrammaticScroll.value = true
        viewport.scrollTop += added * rowHeight
        lastEmittedWeekIndex = Math.round(viewport.scrollTop / rowHeight)
        requestAnimationFrame(() => {
          isProgrammaticScroll.value = false
        })
      } else if (scrollTop + clientHeight > scrollHeight - edgeThreshold) {
        weeks.value = appendScrollMonthWeeks(weeks.value, SCROLL_MONTH_EXTEND_WEEKS)
      }
    }

    const onViewportScroll = () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
      scrollRaf = requestAnimationFrame(() => {
        maybeExtendWeeks()
        syncPeriodFromScroll()
      })
    }

    const scrollToSelectedDate = async (behavior = 'auto') => {
      await nextTick()
      const dateStr = formatDateStr(props.selectedDate)
      let index = findWeekIndexForDate(weeks.value, dateStr)
      if (index < 0) {
        weeks.value = buildScrollMonthWeeks(props.selectedDate)
        index = findWeekIndexForDate(weeks.value, dateStr)
      }
      if (index >= 0) {
        lastEmittedWeekIndex = index
        scrollToWeekIndex(index, behavior)
        const period = periodFromWeekIndex(weeks.value, index)
        if (period) {
          suppressSelectedDateSync.value = true
          emit('updated-period', period)
          nextTick(() => { suppressSelectedDateSync.value = false })
        }
      }
    }

    const onMoreEvents = (dateStr) => {
      const list = eventsForDay(dateStr)
      if (list[0]) emit('select-event', list[0].id)
    }

    watch(
      () => props.selectedDate,
      (next, prev) => {
        if (suppressSelectedDateSync.value) return
        if (!next || !prev) return
        if (formatDateStr(next) === formatDateStr(prev)) return
        scrollToSelectedDate('smooth')
      }
    )

    watch(
      () => props.events,
      () => {
        /* eventsByDate is reactive via computed */
      },
      { deep: true }
    )

    const onResize = () => {
      updateWeekRowHeight()
    }

    onMounted(async () => {
      await nextTick()
      onResize()
      const root = props.rootRef?.value
      const viewport = viewportRef.value
      if (typeof ResizeObserver !== 'undefined') {
        headerObserver = new ResizeObserver(onResize)
        if (root) headerObserver.observe(root)
        if (viewport) headerObserver.observe(viewport)
      }
      window.addEventListener('resize', onResize)
      await scrollToSelectedDate('auto')
    })

    onUnmounted(() => {
      headerObserver?.disconnect()
      window.removeEventListener('resize', onResize)
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
    })

    return {
      viewportRef,
      weeksRef,
      weeks,
      weekdayLabels,
      eventsForDay,
      monthEventStyle,
      monthEventRsvpClass,
      formatMonthEventTime,
      onViewportScroll,
      onMoreEvents
    }
  }
}
</script>

<style scoped>
.calendar-scroll-month {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--neo-bg);
  border-top: none;
}

.calendar-scroll-month__day-names {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 0 0 auto;
  flex-shrink: 0;
  border-bottom: none;
  background: var(--neo-bg);
}

.calendar-scroll-month__day-name {
  padding: 6px 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--neo-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.calendar-scroll-month__viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
}

.calendar-scroll-month__weeks {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.calendar-scroll-month__week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 0 0 var(--week-row-height, 100px);
  height: var(--week-row-height, 100px);
  scroll-snap-align: start;
  scroll-snap-stop: always;
  border-bottom: none;
}

.calendar-scroll-month__day {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  padding: 4px 3px 6px;
  border-right: none;
  overflow: hidden;
  cursor: default;
}

.calendar-scroll-month__day:last-child {
  border-right: none;
}

.calendar-scroll-month__day.is-today .calendar-scroll-month__day-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--neo-accent);
  color: #fff;
  font-weight: 700;
}

.calendar-scroll-month__day-num {
  font-size: 12px;
  color: var(--neo-text-muted);
  line-height: 22px;
  margin-bottom: 2px;
  flex-shrink: 0;
}

.calendar-scroll-month__events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  overflow: hidden;
}

.calendar-month__event.is-event {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  margin: 0;
  padding: 4px 8px 4px 9px;
  font-size: 10px;
  line-height: 1.25;
  overflow: hidden;
  box-sizing: border-box;
}

.calendar-month__event-color {
  display: none;
}

.calendar-month__event-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.calendar-month__event-time {
  flex-shrink: 0;
  font-size: 9px;
}

.calendar-scroll-month__more {
  border: none;
  background: transparent;
  color: var(--neo-text-muted);
  font-size: 10px;
  padding: 0 4px;
  text-align: left;
  cursor: pointer;
}

.calendar-scroll-month__more:hover {
  color: var(--neo-text);
}
</style>
