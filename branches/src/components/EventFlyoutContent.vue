<template>
  <div
    class="vine-event-callout"
    :class="{ 'vine-event-callout--standalone': standalone }"
  >
    <header class="vine-event-callout__toolbar">
      <div v-if="canEdit || canDelete || showRsvpActions" class="vine-event-callout__actions">
        <button
          v-if="showRsvpActions"
          type="button"
          class="vine-callout-btn vine-callout-btn--accept"
          :disabled="saving"
          @click="$emit('accept')"
        >
          {{ saving ? '…' : 'Accept' }}
        </button>
        <button
          v-if="showRsvpActions"
          type="button"
          class="vine-callout-btn vine-callout-btn--reject"
          :disabled="saving"
          @click="$emit('reject')"
        >
          Reject
        </button>
        <button
          v-if="canEdit"
          type="button"
          class="vine-callout-btn"
          title="Edit event"
          @click="$emit('edit')"
        >
          Edit
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="vine-callout-btn vine-callout-btn--delete"
          title="Delete event"
          @click="$emit('delete')"
        >
          Delete
        </button>
      </div>
      <button
        type="button"
        class="vine-callout-btn vine-callout-btn--close"
        aria-label="Close"
        @click="$emit('close')"
      >
        ×
      </button>
    </header>

    <div v-if="qEvent" class="vine-event-callout__body">
      <div v-if="qEvent.title" class="vine-event-callout__title-row">
        <span
          class="vine-event-callout__color-dot"
          :style="{ backgroundColor: eventColor }"
        ></span>
        <h4 class="vine-event-callout__title">{{ qEvent.title }}</h4>
      </div>
      <p v-if="timeLabel" class="vine-event-callout__meta">{{ timeLabel }}</p>
      <p v-if="qEvent.with" class="vine-event-callout__meta">{{ qEvent.with }}</p>
      <p v-if="qEvent.topic" class="vine-event-callout__meta vine-event-callout__meta--muted">
        {{ qEvent.topic }}
      </p>
      <p v-if="qEvent.description" class="vine-event-callout__description">
        {{ qEvent.description }}
      </p>
      <p
        v-if="rsvpStatusLabel"
        class="vine-event-callout__rsvp"
        :class="`is-${dbEvent?.my_response_status || 'pending'}`"
      >
        {{ rsvpStatusLabel }}
      </p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

function parseQalendarDateTime(str) {
  if (!str) return null
  const normalized = String(str).replace(' ', 'T')
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatFlyoutTime(qEvent, dbEvent) {
  if (dbEvent) {
    const start = new Date(dbEvent.start_at)
    const end = new Date(dbEvent.end_at)
    if (dbEvent.all_day) {
      const fmt = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      return start.toDateString() === end.toDateString()
        ? fmt(start)
        : `${fmt(start)} – ${fmt(end)}`
    }
    const datePart = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    const timeFmt = { hour: 'numeric', minute: '2-digit' }
    return `${datePart}, ${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`
  }
  const start = parseQalendarDateTime(qEvent?.time?.start)
  const end = parseQalendarDateTime(qEvent?.time?.end)
  if (!start || !end) return ''
  const hasTime = String(qEvent?.time?.start || '').includes(' ')
  if (!hasTime) {
    const fmt = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    return start.toDateString() === end.toDateString()
      ? fmt(start)
      : `${fmt(start)} – ${fmt(end)}`
  }
  const datePart = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timeFmt = { hour: 'numeric', minute: '2-digit' }
  return `${datePart}, ${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`
}

export default {
  name: 'EventFlyoutContent',
  props: {
    qEvent: { type: Object, default: null },
    dbEvent: { type: Object, default: null },
    saving: { type: Boolean, default: false },
    showRsvpActions: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    /** Full card chrome for month overlay; embedded inside Qalendar flyout when false */
    standalone: { type: Boolean, default: false }
  },
  emits: ['accept', 'reject', 'edit', 'delete', 'close'],
  setup(props) {
    const eventColor = computed(() => props.qEvent?.tagColor || '#667eea')

    const timeLabel = computed(() => formatFlyoutTime(props.qEvent, props.dbEvent))

    const rsvpStatusLabel = computed(() => {
      const status = props.dbEvent?.my_response_status
      if (status === 'accepted') return 'You accepted this event'
      if (status === 'rejected') return 'You declined this event'
      if (props.showRsvpActions) return 'Pending your response'
      return ''
    })

    return { eventColor, timeLabel, rsvpStatusLabel }
  }
}
</script>

<style scoped>
/* Embedded: layout only (Qalendar .event-flyout supplies outer chrome) */
.vine-event-callout {
  min-width: 260px;
  max-width: min(320px, 96vw);
  font-family: inherit;
}

/* Month overlay: full callout window */
.vine-event-callout--standalone {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.09),
    0 6px 12px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.vine-event-callout__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 10px 0;
}

.vine-event-callout__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.vine-callout-btn {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #fff;
  color: #495057;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 11px;
  cursor: pointer;
  font-family: inherit;
  line-height: 1.3;
  white-space: nowrap;
}

.vine-callout-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.vine-callout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vine-callout-btn--accept {
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #fff;
}

.vine-callout-btn--accept:hover:not(:disabled) {
  background: #333;
}

.vine-callout-btn--reject {
  color: #6c757d;
}

.vine-callout-btn--delete {
  color: #c0392b;
  border-color: #f5c6cb;
}

.vine-callout-btn--delete:hover:not(:disabled) {
  background: #fff5f5;
}

.vine-callout-btn--close {
  flex-shrink: 0;
  font-size: 20px;
  line-height: 1;
  padding: 2px 8px;
  border: none;
  color: #6c757d;
  background: transparent;
}

.vine-callout-btn--close:hover:not(:disabled) {
  background: #f0f0f0;
  color: #1a1a1a;
  border-radius: 6px;
}

.vine-event-callout__body {
  padding: 10px 14px 14px;
}

.vine-event-callout__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.vine-event-callout__color-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.vine-event-callout__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.35;
  word-break: break-word;
}

.vine-event-callout__meta {
  margin: 0 0 4px;
  font-size: 13px;
  color: #495057;
  line-height: 1.4;
}

.vine-event-callout__meta--muted {
  color: #6c757d;
  font-size: 12px;
}

.vine-event-callout__description {
  margin: 8px 0 0;
  font-size: 13px;
  color: #495057;
  line-height: 1.45;
  white-space: pre-wrap;
}

.vine-event-callout__rsvp {
  margin: 10px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
}

.vine-event-callout__rsvp.is-pending {
  color: #b45309;
}

.vine-event-callout__rsvp.is-accepted {
  color: #059669;
}

.vine-event-callout__rsvp.is-rejected {
  color: #6c757d;
}
</style>
