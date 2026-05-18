<template>
  <div class="calendar-page">
    <header class="calendar-topbar">
      <div class="calendar-topbar__head">
        <h1>Calendar</h1>
        <p class="subtitle">Each calendar groups events by tag — share with collaborators</p>
      </div>
      <div class="calendar-topbar__actions">
        <button
          type="button"
          class="calendar-action-btn calendar-action-create"
          @click="openCreateCalendarModal"
        >
          Create
        </button>
        <button
          type="button"
          class="calendar-action-btn calendar-action-info"
          :disabled="!canOpenCalendarInfo"
          @click="openCalendarInfoPanel"
        >
          Info
        </button>
      </div>
    </header>

    <div class="calendar-body">
      <aside class="calendar-sidebar">
        <section class="calendar-sidebar__tags">
          <p class="calendar-sidebar__tags-label">Calendars</p>
          <div class="calendar-tag-list">
            <button
              type="button"
              class="folder-tag"
              :class="{ active: activeTagId === null }"
              @click="activeTagId = null"
              :title="'All calendars'"
            >
              {{ truncateTagLabel('All calendars') }}
            </button>
            <button
              v-for="(tag, index) in tags"
              :key="tag.id"
              type="button"
              class="folder-tag calendar-tag"
              draggable="true"
              :class="{
                active: activeTagId === tag.id,
                'tag-personal': isPersonalTag(tag),
                'tag-shared': isSharedTag(tag),
                'tag-dragging': tagDragIndex === index,
                'tag-drag-over': tagDropIndex === index
              }"
              :style="calendarTagStyle(tag)"
              @click="activeTagId = tag.id"
              @dragstart="onTagDragStart($event, index)"
              @dragover.prevent="onTagDragOver($event, index)"
              @drop.prevent="onTagDrop($event, index)"
              @dragend="onTagDragEnd"
            >
              <span v-if="isSharedTag(tag)" class="tag-shared-icon" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
              <span class="calendar-tag-label" :title="tag.name">{{ truncateTagLabel(tag.name) }}</span>
            </button>
          </div>
        </section>
      </aside>

      <main class="calendar-main">
        <div v-if="loadError" class="error-banner">{{ loadError }}</div>

        <div ref="calendarWrapperRef" class="calendar-wrapper is-light-mode">
          <Qalendar
            :events="qalendarEvents"
            :config="qalendarConfig"
            :is-loading="loading"
            @edit-event="onEditEvent"
            @delete-event="onDeleteEvent"
            @event-was-dragged="onEventDragged"
            @event-was-resized="onEventResized"
            @updated-period="onPeriodUpdated"
          >
            <template #weekDayEvent="{ eventData }">
              <div
                class="vine-week-event"
                :style="weekEventBlockStyle(eventData)"
              >
                <div class="vine-week-event__title">{{ eventData.title }}</div>
                <p v-if="showWeekEventTime(eventData)" class="vine-week-event__time">
                  {{ formatWeekEventTime(eventData) }}
                </p>
                <p v-if="showWeekEventCreator(eventData)" class="vine-week-event__creator">
                  {{ eventData.with }}
                </p>
              </div>
            </template>
          </Qalendar>
          <div
            v-if="dragPreview"
            class="drag-preview"
            :style="dragPreview"
          ></div>
        </div>
      </main>
    </div>

    <!-- Calendar info modal -->
    <div v-if="showCalendarInfoPanel" class="modal-overlay" @click.self="closeCalendarInfoPanel">
      <div class="modal modal-wide calendar-info-modal">
        <div class="calendar-info-modal-head">
          <div>
            <h3>{{ activeCalendar?.name }}</h3>
            <span class="calendar-info-type" :class="{ 'is-shared': isInvitedCalendar }">
              {{ calendarInfoTypeLabel }}
            </span>
          </div>
          <button type="button" class="calendar-info-close" aria-label="Close" @click="closeCalendarInfoPanel">
            ×
          </button>
        </div>

        <div class="calendar-info-body">
          <section class="calendar-info-section">
            <h3>Details</h3>
            <dl class="calendar-info-details">
              <div class="calendar-info-detail-row">
                <dt>Owner</dt>
                <dd>{{ calendarOwnerLabel }}</dd>
              </div>
              <div class="calendar-info-detail-row">
                <dt>Your role</dt>
                <dd>{{ currentUserCalendarRole }}</dd>
              </div>
              <div class="calendar-info-detail-row">
                <dt>Events</dt>
                <dd>{{ calendarDeleteEventCount }}</dd>
              </div>
              <div v-if="calendarCreatedLabel" class="calendar-info-detail-row">
                <dt>Created</dt>
                <dd>{{ calendarCreatedLabel }}</dd>
              </div>
            </dl>
            <p v-if="isInvitedCalendar" class="calendar-info-hint">
              You were invited to this calendar. Sharing, removing members, and deleting are only available to the owner.
              <template v-if="!canEditCalendarEvents"> Members can view events but cannot edit them.</template>
            </p>
          </section>

          <section class="calendar-info-section">
            <div class="calendar-info-section-head">
              <h3>Members</h3>
              <span class="calendar-info-count">{{ infoCalendarMembers.length }}</span>
            </div>
            <p v-if="infoRemoveMode" class="calendar-info-hint">
              Select members to remove from this calendar.
            </p>
            <div v-if="infoLoadingMembers" class="calendar-info-loading">Loading members…</div>
            <ul v-else-if="infoCalendarMembers.length" class="calendar-info-members">
              <li
                v-for="member in infoCalendarMembers"
                :key="member.id"
                class="calendar-info-member"
                :class="{ selectable: infoRemoveMode && canRemoveMember(member) }"
                @click="infoRemoveMode && canRemoveMember(member) && toggleInfoMemberSelection(member.id)"
              >
                <input
                  v-if="infoRemoveMode && canRemoveMember(member)"
                  type="checkbox"
                  class="calendar-info-member-checkbox"
                  :checked="infoSelectedMemberIds.includes(member.id)"
                  @click.stop
                  @change="toggleInfoMemberSelection(member.id)"
                />
                <span class="calendar-info-member-avatar">{{ memberInitial(member) }}</span>
                <div class="calendar-info-member-info">
                  <span class="calendar-info-member-name">{{ memberLabel(member) }}</span>
                  <span class="calendar-info-member-email">{{ member.user_email }}</span>
                </div>
                <span class="calendar-info-member-role" :class="`role-${memberRoleClass(member.role)}`">
                  {{ memberRoleLabel(member.role) }}
                </span>
              </li>
            </ul>
            <p v-else class="calendar-info-empty">No members listed yet.</p>
          </section>
        </div>

        <footer class="calendar-info-footer">
          <template v-if="infoRemoveMode">
            <button type="button" class="btn-secondary" @click="cancelInfoRemoveMode">Cancel</button>
            <button
              type="button"
              class="btn-danger"
              :disabled="!canManageCalendar || !infoSelectedMemberIds.length || saving"
              @click="openRemoveMembersModal"
            >
              {{ saving ? 'Removing…' : `Remove (${infoSelectedMemberIds.length})` }}
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="calendar-info-action-btn calendar-info-action-share"
              :disabled="!canManageCalendar"
              :title="!canManageCalendar ? 'Only the owner can share' : 'Share calendar'"
              @click="openShareFromInfo"
            >
              Share
            </button>
            <button
              type="button"
              class="calendar-info-action-btn calendar-info-action-remove"
              :disabled="!canManageCalendar || !removableMembersCount"
              :title="!canManageCalendar ? 'Only the owner can remove members' : 'Remove members'"
              @click="startInfoRemoveMode"
            >
              Remove
            </button>
            <button
              type="button"
              class="calendar-info-action-btn calendar-info-action-delete"
              :disabled="!canManageCalendar"
              :title="!canManageCalendar ? 'Only the owner can delete' : 'Delete calendar'"
              @click="openDeleteFromInfo"
            >
              Delete
            </button>
          </template>
        </footer>
      </div>
    </div>

    <!-- Confirm remove members -->
    <div v-if="showRemoveMembersModal" class="modal-overlay" @click.self="showRemoveMembersModal = false">
      <div class="modal">
        <h3>Remove members</h3>
        <p class="modal-warning">
          Remove {{ membersToRemove.length }} member{{ membersToRemove.length === 1 ? '' : 's' }} from
          "{{ activeCalendar?.name }}"? They will lose access to this calendar.
          This action cannot be undone.
        </p>
        <ul class="calendar-info-remove-preview">
          <li v-for="member in membersToRemove" :key="member.id">
            {{ member.user_email }}
          </li>
        </ul>
        <div class="modal-actions modal-actions-confirm">
          <button type="button" class="btn-secondary" @click="showRemoveMembersModal = false">Cancel</button>
          <button type="button" class="btn-danger" :disabled="saving" @click="performRemoveMembers">Remove</button>
        </div>
      </div>
    </div>

    <!-- Share calendar modal -->
    <div v-if="showShareCalendarModal" class="modal-overlay" @click.self="closeShareCalendarModal">
      <div class="modal modal-wide share-modal">
        <h3>Share "{{ activeCalendar?.name }}"</h3>
        <p class="share-modal-hint">Search and select people to share this calendar with.</p>
        <div class="form-group share-role-group">
          <label>Access level</label>
          <div class="share-role-options">
            <label class="share-role-option" :class="{ active: shareInviteRole === 'admin' }">
              <input v-model="shareInviteRole" type="radio" value="admin" />
              <span class="share-role-option-text">
                <span class="share-role-title">Admin</span>
                <span class="share-role-desc">Can create and edit events</span>
              </span>
            </label>
            <label class="share-role-option" :class="{ active: shareInviteRole === 'member' }">
              <input v-model="shareInviteRole" type="radio" value="member" />
              <span class="share-role-option-text">
                <span class="share-role-title">Member</span>
                <span class="share-role-desc">View only — cannot edit events</span>
              </span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Search users</label>
          <input
            v-model="shareSearchQuery"
            type="search"
            class="input"
            placeholder="Search by name or email"
            autocomplete="off"
          />
        </div>
        <div v-if="shareSearchError" class="share-search-error">{{ shareSearchError }}</div>
        <div v-if="shareLoadingUsers" class="share-loading">Loading users…</div>
        <ul v-else class="share-user-list">
          <li v-if="!filteredShareUsers.length" class="share-empty">No users found</li>
          <li
            v-for="user in filteredShareUsers"
            :key="user.id || user.email"
            class="share-user-row"
            :class="{ selected: isShareUserSelected(user), disabled: isShareUserAlreadyMember(user) }"
            @click="toggleShareUser(user)"
          >
            <input
              type="checkbox"
              class="share-user-checkbox"
              :checked="isShareUserSelected(user) || isShareUserAlreadyMember(user)"
              :disabled="isShareUserAlreadyMember(user)"
              @click.stop
              @change="toggleShareUser(user)"
            />
            <div class="share-user-info">
              <span class="share-user-name">{{ user.display_name || user.email }}</span>
              <span class="share-user-email">{{ user.email }}</span>
            </div>
            <span v-if="isShareUserAlreadyMember(user)" class="share-user-badge">Shared</span>
          </li>
        </ul>
        <div v-if="shareCalendarMembers.length" class="share-current">
          <p class="share-current-label">Currently shared with</p>
          <div class="share-current-chips">
            <span
              v-for="member in shareCalendarMembers"
              :key="member.id"
              class="share-chip"
            >
              {{ memberLabel(member) }} · {{ memberRoleLabel(member.role) }}
            </span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeShareCalendarModal">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="saving || !shareSelectedEmails.length"
            @click="performShareCalendar"
          >
            {{ saving ? 'Sharing…' : `Share (${shareSelectedEmails.length})` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm delete event (same pattern as Library) -->
    <div v-if="showDeleteEventModal" class="modal-overlay" @click.self="cancelDeleteEvent">
      <div class="modal">
        <h3>Confirm Delete</h3>
        <p class="modal-warning">
          Are you sure you want to delete "{{ eventToDelete?.title || 'this event' }}"?
          This action cannot be undone.
        </p>
        <div class="modal-actions modal-actions-confirm">
          <button type="button" class="btn-secondary" @click="cancelDeleteEvent">Cancel</button>
          <button type="button" class="btn-danger" :disabled="saving" @click="performDeleteEvent">Delete</button>
        </div>
      </div>
    </div>

    <!-- Confirm delete calendar (same pattern as Library) -->
    <div v-if="showDeleteCalendarModal" class="modal-overlay" @click.self="showDeleteCalendarModal = false">
      <div class="modal">
        <h3>Confirm Delete</h3>
        <p class="modal-warning">
          Are you sure you want to delete "{{ activeCalendar?.name }}"?
          <template v-if="calendarDeleteEventCount > 0">
            All events in this calendar will also be deleted.
          </template>
          This action cannot be undone.
        </p>
        <div class="modal-actions modal-actions-confirm">
          <button type="button" class="btn-secondary" @click="showDeleteCalendarModal = false">Cancel</button>
          <button type="button" class="btn-danger" :disabled="saving" @click="performDeleteCalendar">Delete</button>
        </div>
      </div>
    </div>

    <!-- Create calendar modal -->
    <div v-if="showCreateCalendarModal" class="modal-overlay" @click.self="showCreateCalendarModal = false">
      <div class="modal">
        <h3>Create new calendar</h3>
        <form @submit.prevent="saveNewCalendar">
          <div class="form-group">
            <label>Calendar name</label>
            <input
              v-model="newCalendarName"
              type="text"
              class="input"
              placeholder=""
              required
              maxlength="100"
            />
          </div>
          <div class="form-group">
            <label>Tag color</label>
            <div class="color-palette">
              <button
                v-for="color in colorPalette"
                :key="color"
                type="button"
                class="color-circle"
                :class="{ active: newCalendarColor === color }"
                :style="{ background: color }"
                @click.prevent="newCalendarColor = color"
                :title="color"
              >
                <svg
                  v-if="newCalendarColor === color"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="3"
                >
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="modal-actions">
            <div></div>
            <div class="modal-actions-right">
              <button type="button" class="btn-secondary" @click="showCreateCalendarModal = false">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Creating…' : 'Create calendar' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Event modal -->
    <div v-if="showEventModal" class="modal-overlay" @click.self="closeEventModal">
      <div class="modal event-modal">
        <h3>{{ editingEventId ? 'Edit event' : 'New event' }}</h3>

        <form @submit.prevent="saveEvent">
          <div class="form-group">
            <label>Title</label>
            <input
              v-model="eventForm.title"
              type="text"
              class="input"
              placeholder="Event title"
              required
              maxlength="500"
            />
          </div>

          <div class="form-group">
            <label>Calendar</label>
            <div v-if="tags.length" class="event-tag-picker">
              <button
                v-for="tag in tags"
                :key="tag.id"
                type="button"
                class="folder-tag"
                :class="{ active: eventForm.tagId === tag.id }"
                :style="eventTagStyle(tag)"
                @click="eventForm.tagId = tag.id"
              >
                {{ tag.name }}
              </button>
            </div>
            <p v-else class="field-hint">Create a calendar with the Create button above.</p>
          </div>

          <div class="form-group time-section">
            <div class="time-section-header">
              <label>{{ eventForm.allDay ? 'Date' : 'Time' }}</label>
              <label class="toggle-label compact">
                <span class="toggle-track">
                  <input
                    type="checkbox"
                    class="toggle-checkbox"
                    :checked="eventForm.allDay"
                    @change="setEventAllDay($event.target.checked)"
                  />
                  <span class="toggle-switch" aria-hidden="true"></span>
                </span>
                <span class="toggle-text">All day</span>
              </label>
            </div>
            <template v-if="eventForm.allDay">
              <div class="form-row">
                <div class="form-group">
                  <label class="sub-label">Start date</label>
                  <VueDatePicker
                    v-model="eventForm.startDate"
                    v-bind="datePickerBind"
                    class="event-date-picker"
                    placeholder="Start date"
                  />
                </div>
                <div class="form-group">
                  <label class="sub-label">End date</label>
                  <VueDatePicker
                    v-model="eventForm.endDate"
                    v-bind="datePickerBind"
                    class="event-date-picker"
                    placeholder="End date"
                  />
                </div>
              </div>
            </template>
            <template v-else>
              <div class="form-group">
                <label class="sub-label">Date</label>
                <VueDatePicker
                  v-model="eventForm.eventDate"
                  v-bind="datePickerBind"
                  class="event-date-picker"
                  placeholder="Select date"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="sub-label">Start</label>
                  <VueDatePicker
                    v-model="eventStartTime"
                    v-bind="timePickerBind"
                    time-picker
                    :time-config="timePickerConfig"
                    class="event-date-picker event-time-picker"
                    placeholder="Start time"
                  />
                </div>
                <div class="form-group">
                  <label class="sub-label">End</label>
                  <VueDatePicker
                    v-model="eventEndTime"
                    v-bind="timePickerBind"
                    time-picker
                    :time-config="timePickerConfig"
                    class="event-date-picker event-time-picker"
                    placeholder="End time"
                  />
                </div>
              </div>
            </template>
          </div>

          <div class="form-group">
            <label>Note</label>
            <textarea
              v-model="eventForm.description"
              class="input textarea"
              rows="3"
              placeholder="Add a note"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button
              v-if="editingEventId"
              type="button"
              class="btn-danger-outline"
              @click="confirmDeleteEvent"
            >
              Delete
            </button>
            <div v-else></div>
            <div class="modal-actions-right">
              <button type="button" class="btn-secondary" @click="closeEventModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving || !eventForm.tagId">
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Qalendar } from 'qalendar'
import 'qalendar/dist/style.css'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { supabase } from '../supabase'
import { useCalendarEvents, snapTo15Minutes } from '../composables/useCalendarEvents'
import { useCalendarDragCreate, buildWeekPeriod } from '../composables/useCalendarDragCreate'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toDateInput(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function toTimeInput(iso) {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function eventFieldsFromIso(startIso, endIso, allDay) {
  if (allDay) {
    return {
      eventDate: '',
      startTime: '',
      endTime: '',
      startDate: toDateInput(startIso),
      endDate: toDateInput(endIso)
    }
  }
  return {
    eventDate: toDateInput(startIso),
    startTime: toTimeInput(startIso),
    endTime: toTimeInput(endIso),
    startDate: '',
    endDate: ''
  }
}

function parseTimeToPicker(timeStr) {
  if (!timeStr) return { hours: 9, minutes: 0 }
  const [h, m] = timeStr.split(':').map(Number)
  return {
    hours: Number.isFinite(h) ? h : 9,
    minutes: Number.isFinite(m) ? m : 0
  }
}

function formatPickerToTime(val) {
  if (!val || typeof val !== 'object') return ''
  return `${pad2(val.hours ?? 0)}:${pad2(val.minutes ?? 0)}`
}

const datePickerBind = {
  modelType: 'yyyy-MM-dd',
  format: 'MMM d, yyyy',
  autoApply: true,
  textInput: true,
  teleport: 'body',
  timeConfig: { enableTimePicker: false }
}

const timePickerBind = {
  autoApply: true,
  textInput: true,
  teleport: 'body',
  config: {
    modeHeight: 88
  },
  actionRow: {
    showSelect: false,
    showCancel: false,
    showPreview: false
  },
  ui: {
    menu: 'event-time-picker-menu'
  }
}

const timePickerConfig = {
  minutesIncrement: 15,
  minutesGridIncrement: 15,
  is24: true,
  noHoursOverlay: true,
  noMinutesOverlay: true
}

function eventTimesFromForm(form) {
  if (form.allDay) {
    const startDate = form.startDate
    let endDate = form.endDate || form.startDate
    if (!startDate) throw new Error('Start date is required')
    if (endDate < startDate) endDate = startDate
    return {
      startAt: new Date(`${startDate}T00:00:00`).toISOString(),
      endAt: new Date(`${endDate}T23:59:59`).toISOString()
    }
  }
  const { eventDate, startTime, endTime } = form
  if (!eventDate || !startTime || !endTime) {
    throw new Error('Date and times are required')
  }
  const startAt = new Date(`${eventDate}T${startTime}:00`)
  let endAt = new Date(`${eventDate}T${endTime}:00`)
  if (endAt <= startAt) {
    endAt = new Date(startAt.getTime() + 15 * 60 * 1000)
  }
  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString()
  }
}

function parseWeekEventDateTime(s) {
  if (!s?.includes(' ')) return null
  const [date, time] = s.split(' ')
  return new Date(`${date}T${time}:00`)
}

function getWeekEventDurationMinutes(eventData) {
  const startStr = eventData?.originalTime?.start ?? eventData?.time?.start
  const endStr = eventData?.originalTime?.end ?? eventData?.time?.end
  const start = parseWeekEventDateTime(startStr)
  const end = parseWeekEventDateTime(endStr)
  if (!start || !end) return 30
  return Math.max(0, (end.getTime() - start.getTime()) / 60000)
}

function showWeekEventTime(eventData) {
  return getWeekEventDurationMinutes(eventData) > 30
}

function showWeekEventCreator(eventData) {
  return getWeekEventDurationMinutes(eventData) > 15 && Boolean(eventData?.with)
}

function formatWeekEventTime(eventData) {
  const start = parseWeekEventDateTime(eventData?.time?.start)
  const end = parseWeekEventDateTime(eventData?.time?.end)
  if (!start || !end) return ''
  const opts = { hour: 'numeric', minute: '2-digit', hour12: true }
  return `${start.toLocaleTimeString('en-US', opts)} – ${end.toLocaleTimeString('en-US', opts)}`
}

/** Qalendar emits event id (string) for edit/delete, full object for drag. */
function resolveQalendarEventId(payload) {
  if (payload == null) return null
  if (typeof payload === 'string') return payload
  return payload.id ?? null
}

const TAG_LABEL_MAX_CHARS = 13

function truncateTagLabel(name, maxChars = TAG_LABEL_MAX_CHARS) {
  const text = (name || '').trim()
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars - 1)}…`
}

const colorPalette = [
  '#ff6b6b', '#ff8c42', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e',
  '#577590', '#9B5DE5', '#f15bb5', '#fee440', '#00BBF9', '#00F5D4',
  '#9C89B8', '#EF476F', '#FFD166', '#06D6A0'
]

export default {
  name: 'CalendarScreen',
  components: { Qalendar, VueDatePicker },
  setup() {
    const userId = ref(null)
    const userEmail = ref('')
    const displayName = ref('')
    const loadError = ref('')
    const saving = ref(false)
    const activeTagId = ref(null)
    const showEventModal = ref(false)
    const showCreateCalendarModal = ref(false)
    const showDeleteCalendarModal = ref(false)
    const showDeleteEventModal = ref(false)
    const eventToDelete = ref(null)
    const showShareCalendarModal = ref(false)
    const shareSearchQuery = ref('')
    const shareUsers = ref([])
    const shareLoadingUsers = ref(false)
    const shareSelectedUserIds = ref([])
    const shareCalendarMembers = ref([])
    const shareSearchError = ref('')
    const shareInviteRole = ref('admin')
    const showCalendarInfoPanel = ref(false)
    const infoCalendarMembers = ref([])
    const infoLoadingMembers = ref(false)
    const infoRemoveMode = ref(false)
    const infoSelectedMemberIds = ref([])
    const showRemoveMembersModal = ref(false)
    const membersToRemove = ref([])
    const tagDragIndex = ref(null)
    const tagDropIndex = ref(null)
    const calendarWrapperRef = ref(null)
    const calendarPeriod = ref(buildWeekPeriod())
    const editingEventId = ref(null)
    const newCalendarName = ref('')
    const newCalendarColor = ref('#6b7280')

    const eventForm = ref({
      title: '',
      tagId: '',
      allDay: false,
      eventDate: '',
      startTime: '',
      endTime: '',
      startDate: '',
      endDate: '',
      description: ''
    })

    const eventStartTime = computed({
      get: () => parseTimeToPicker(eventForm.value.startTime),
      set: (v) => { eventForm.value.startTime = formatPickerToTime(v) }
    })

    const eventEndTime = computed({
      get: () => parseTimeToPicker(eventForm.value.endTime),
      set: (v) => { eventForm.value.endTime = formatPickerToTime(v) }
    })

    const {
      loading,
      tags,
      events,
      getTags,
      upsertUserProfile,
      searchUsers,
      createTag,
      deleteTag,
      updateTagOrder,
      getMembers,
      inviteMembers,
      removeMember,
      getEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      toQalendarEvents,
      buildColorSchemes,
      fromQalendarDrag,
      subscribeToEvents
    } = useCalendarEvents()

    const activeCalendar = computed(() =>
      tags.value.find(t => t.id === activeTagId.value) || null
    )

    const canDeleteCalendar = computed(() => {
      const cal = activeCalendar.value
      return Boolean(cal && cal.owner_id === userId.value)
    })

    const canOpenCalendarInfo = computed(() => Boolean(activeTagId.value))

    const canManageCalendar = computed(() => {
      const cal = activeCalendar.value
      return Boolean(cal && cal.owner_id === userId.value)
    })

    const isInvitedCalendar = computed(() => {
      const cal = activeCalendar.value
      return Boolean(cal && cal.owner_id !== userId.value)
    })

    const calendarInfoTypeLabel = computed(() =>
      isInvitedCalendar.value ? 'Shared with you' : 'Your calendar'
    )

    const calendarOwnerLabel = computed(() => {
      const cal = activeCalendar.value
      if (!cal) return '—'
      const ownerMember = infoCalendarMembers.value.find(m => m.role === 'owner')
      return ownerMember?.user_email || cal.owner_email || '—'
    })

    const currentUserCalendarRole = computed(() => {
      const email = (userEmail.value || '').toLowerCase()
      const me = infoCalendarMembers.value.find(m =>
        m.user_id === userId.value ||
        (m.user_email || '').toLowerCase() === email
      )
      return memberRoleLabel(me?.role || (canManageCalendar.value ? 'owner' : 'member'))
    })

    const calendarCreatedLabel = computed(() => {
      const created = activeCalendar.value?.created_at
      if (!created) return ''
      return new Date(created).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

    const removableMembersCount = computed(() =>
      infoCalendarMembers.value.filter(m => m.role !== 'owner').length
    )

    const isPersonalTag = (tag) => tag.owner_id === userId.value
    const isSharedTag = (tag) => tag.owner_id !== userId.value

    const canEditTag = (tagId) => {
      if (!tagId) return false
      const tag = tags.value.find(t => t.id === tagId)
      if (!tag) return false
      if (tag.owner_id === userId.value) return true
      const role = tag.my_role
      return role === 'owner' || role === 'editor'
    }

    const canEditCalendarEvents = computed(() => {
      if (!activeTagId.value) {
        return tags.value.some(t => canEditTag(t.id))
      }
      return canEditTag(activeTagId.value)
    })

    const shareRoleToDbRole = (shareRole) => (shareRole === 'admin' ? 'editor' : 'viewer')

    const calendarTagStyle = (tag) => {
      if (isSharedTag(tag)) {
        return { color: tag.color, borderColor: tag.color }
      }
      return { color: tag.color, borderColor: tag.color }
    }

    const filteredShareUsers = computed(() => {
      const q = shareSearchQuery.value.trim().toLowerCase()
      if (!q) return shareUsers.value
      return shareUsers.value.filter((user) => {
        const name = (user.display_name || '').toLowerCase()
        const email = (user.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    })

    const shareSelectedEmails = computed(() =>
      shareUsers.value
        .filter(u => shareSelectedUserIds.value.includes(u.id))
        .map(u => u.email)
    )

    const memberEmails = computed(() =>
      new Set(
        shareCalendarMembers.value
          .filter(m => m.role !== 'owner')
          .map(m => (m.user_email || '').toLowerCase())
      )
    )

    const calendarDeleteEventCount = computed(() => {
      if (!activeTagId.value) return 0
      return events.value.filter(e => e.tag_id === activeTagId.value).length
    })

    const filteredEvents = computed(() => {
      if (!activeTagId.value) return events.value
      return events.value.filter(e => e.tag_id === activeTagId.value)
    })

    const qalendarEvents = computed(() => toQalendarEvents(filteredEvents.value))

    const qalendarConfig = computed(() => {
      const visibleTags = activeTagId.value
        ? tags.value.filter(t => t.id === activeTagId.value)
        : tags.value
      return {
        week: { startsOn: 'sunday', nDays: 7, scrollToHour: 8 },
        defaultMode: 'week',
        locale: 'en-US',
        style: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          colorSchemes: buildColorSchemes(visibleTags)
        },
        isSilent: true,
        showCurrentTime: true
      }
    })

    const weekEventBlockStyle = (eventData) => {
      const scheme = qalendarConfig.value.style?.colorSchemes?.[eventData?.colorScheme]
      return {
        backgroundColor: scheme?.backgroundColor || '#667eea',
        color: scheme?.color || '#fff'
      }
    }

    const allTagIds = computed(() => tags.value.map(t => t.id))

    const refreshEvents = async () => {
      if (allTagIds.value.length) {
        await getEvents(allTagIds.value)
      } else {
        events.value = []
      }
    }

    const init = async () => {
      loadError.value = ''
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId.value = user.id
      userEmail.value = user.email || ''
      displayName.value = user.user_metadata?.display_name || user.email?.split('@')[0] || ''

      await upsertUserProfile(
        user.id,
        user.email,
        user.user_metadata?.display_name || user.email?.split('@')[0] || ''
      )
      await getTags(user.id, user.email)
      if (tags.value.length) {
        eventForm.value.tagId = tags.value[0].id
      }
      await refreshEvents()
    }

    const eventTagStyle = (tag) => ({
      color: tag.color,
      borderColor: tag.color
    })

    const { dragPreview, ensureAttach: ensureDragCreate, detach: detachDragCreate } = useCalendarDragCreate({
      wrapperRef: calendarWrapperRef,
      getPeriod: () => calendarPeriod.value,
      onRangeSelected: ({ start, end, allDay }) => {
        if (!tags.value.length) {
          loadError.value = 'Create a calendar first, then drag on the grid to add an event.'
          return
        }
        const tagId = activeTagId.value || tags.value.find(t => canEditTag(t.id))?.id
        if (!tagId || !canEditTag(tagId)) {
          loadError.value = calendarEditDeniedMessage
          return
        }
        if (!activeTagId.value) activeTagId.value = tagId
        openNewEvent(start, end, allDay)
      }
    })

    const onPeriodUpdated = (period) => {
      if (!period?.start) return
      calendarPeriod.value = {
        start: period.start,
        end: period.end,
        selectedDate: period.selectedDate ?? period.start
      }
    }

    watch(loading, async (isLoading) => {
      if (!isLoading) {
        await ensureDragCreate()
      }
    })

    let unsubscribe = null
    onMounted(async () => {
      await init()
      unsubscribe = subscribeToEvents(refreshEvents)
      await ensureDragCreate()
    })
    onUnmounted(() => {
      if (unsubscribe) unsubscribe()
      detachDragCreate()
    })

    const resetEventForm = (startHint, endHint, allDayHint = false) => {
      let allDay = allDayHint
      let fields = {
        eventDate: '',
        startTime: '',
        endTime: '',
        startDate: '',
        endDate: ''
      }

      if (startHint) {
        allDay = allDayHint || !String(startHint).includes(' ')
        if (allDay) {
          const startDay = String(startHint).slice(0, 10)
          const endDay = String(endHint || startHint).slice(0, 10)
          fields = {
            eventDate: '',
            startTime: '',
            endTime: '',
            startDate: startDay,
            endDate: endDay
          }
        } else {
          const [startDay, startTimeRaw] = String(startHint).split(' ')
          const startTime = (startTimeRaw || '09:00').slice(0, 5)
          let endTime = startTime
          if (endHint && String(endHint).includes(' ')) {
            const [, et] = String(endHint).split(' ')
            endTime = (et || startTime).slice(0, 5)
          } else {
            const [h, m] = startTime.split(':').map(Number)
            const endMins = (h * 60 + m + 15) % (24 * 60)
            endTime = `${pad2(Math.floor(endMins / 60))}:${pad2(endMins % 60)}`
          }
          fields = {
            eventDate: startDay,
            startTime,
            endTime,
            startDate: '',
            endDate: ''
          }
        }
      } else {
        const now = snapTo15Minutes(new Date())
        const end = snapTo15Minutes(new Date(now.getTime() + 15 * 60 * 1000))
        fields = eventFieldsFromIso(now.toISOString(), end.toISOString(), false)
      }

      eventForm.value = {
        title: '',
        tagId: activeTagId.value || tags.value[0]?.id || '',
        allDay,
        ...fields,
        description: ''
      }
    }

    const setEventAllDay = (allDay) => {
      const form = { ...eventForm.value }
      if (form.allDay === allDay) return

      if (allDay) {
        const date = form.eventDate || form.startDate || toDateInput(new Date().toISOString())
        form.startDate = date
        form.endDate = form.endDate || date
        form.eventDate = ''
        form.startTime = ''
        form.endTime = ''
      } else {
        const date = form.startDate || form.eventDate || toDateInput(new Date().toISOString())
        form.eventDate = date
        form.startTime = form.startTime || '09:00'
        form.endTime = form.endTime || '10:00'
        form.startDate = ''
        form.endDate = ''
      }
      form.allDay = allDay
      eventForm.value = form
    }

    const openCreateCalendarModal = () => {
      newCalendarName.value = ''
      newCalendarColor.value = '#6b7280'
      showCreateCalendarModal.value = true
    }

    const saveNewCalendar = async () => {
      const name = newCalendarName.value.trim()
      if (!name) return
      saving.value = true
      loadError.value = ''
      try {
        const tag = await createTag(
          userId.value,
          userEmail.value,
          name,
          newCalendarColor.value
        )
        activeTagId.value = tag.id
        eventForm.value.tagId = tag.id
        showCreateCalendarModal.value = false
        await updateTagOrder(
          userId.value,
          userEmail.value,
          [...tags.value.map(t => t.id)]
        )
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message || 'Failed to create calendar'
      } finally {
        saving.value = false
      }
    }

    const openNewEvent = (startHint, endHint, allDay = false) => {
      if (!tags.value.length) {
        loadError.value = 'Create a calendar first, then drag on the grid to add an event.'
        return
      }
      const tagId = activeTagId.value || tags.value.find(t => canEditTag(t.id))?.id
      if (!tagId || !canEditTag(tagId)) {
        loadError.value = calendarEditDeniedMessage
        return
      }
      editingEventId.value = null
      resetEventForm(startHint, endHint, allDay)
      showEventModal.value = true
    }

    const onEditEvent = (payload) => {
      const eventId = resolveQalendarEventId(payload)
      const db = events.value.find(e => e.id === eventId)
      if (!db) return
      if (!canEditTag(db.tag_id)) {
        loadError.value = calendarEditDeniedMessage
        return
      }
      editingEventId.value = db.id
      eventForm.value = {
        title: db.title,
        tagId: db.tag_id,
        allDay: db.all_day,
        ...eventFieldsFromIso(db.start_at, db.end_at, db.all_day),
        description: db.description || ''
      }
      showEventModal.value = true
    }

    const closeEventModal = () => {
      showEventModal.value = false
      editingEventId.value = null
    }

    const saveEvent = async () => {
      if (!eventForm.value.tagId) {
        loadError.value = 'Please select a calendar'
        return
      }
      if (!canEditTag(eventForm.value.tagId)) {
        loadError.value = calendarEditDeniedMessage
        return
      }
      saving.value = true
      loadError.value = ''
      try {
        const tagId = eventForm.value.tagId
        const { startAt, endAt } = eventTimesFromForm(eventForm.value)
        const payload = {
          tagId,
          title: eventForm.value.title,
          description: eventForm.value.description,
          location: '',
          startAt,
          endAt,
          allDay: eventForm.value.allDay
        }

        if (editingEventId.value) {
          await updateEvent(editingEventId.value, {
            tag_id: payload.tagId,
            title: payload.title,
            description: payload.description,
            location: payload.location,
            start_at: payload.startAt,
            end_at: payload.endAt,
            all_day: payload.allDay
          })
        } else {
          await createEvent(userId.value, userEmail.value, displayName.value, payload)
          activeTagId.value = tagId
        }

        closeEventModal()
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message || 'Failed to save event'
      } finally {
        saving.value = false
      }
    }

    const getEventTitleById = (eventId) => {
      const event = events.value.find(e => e.id === eventId)
      return (event?.title || '').trim() || 'Untitled'
    }

    const openDeleteEventModal = (eventId, title) => {
      if (!eventId) return
      eventToDelete.value = {
        id: eventId,
        title: (title || '').trim() || getEventTitleById(eventId)
      }
      showDeleteEventModal.value = true
    }

    const cancelDeleteEvent = () => {
      showDeleteEventModal.value = false
      eventToDelete.value = null
    }

    const confirmDeleteEvent = () => {
      if (!editingEventId.value) return
      if (!canEditTag(eventForm.value.tagId)) {
        loadError.value = calendarEditDeniedMessage
        return
      }
      openDeleteEventModal(editingEventId.value, eventForm.value.title)
    }

    const performDeleteEvent = async () => {
      const target = eventToDelete.value
      if (!target?.id) return
      saving.value = true
      loadError.value = ''
      try {
        await deleteEvent(target.id)
        const wasEditing = editingEventId.value === target.id
        cancelDeleteEvent()
        if (wasEditing) closeEventModal()
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message || 'Failed to delete event'
      } finally {
        saving.value = false
      }
    }

    const onDeleteEvent = (payload) => {
      const eventId = resolveQalendarEventId(payload)
      if (!eventId) return
      const db = events.value.find(e => e.id === eventId)
      if (db && !canEditTag(db.tag_id)) {
        loadError.value = calendarEditDeniedMessage
        return
      }
      const title = typeof payload === 'object' && payload != null
        ? (payload.title || payload.name || '')
        : ''
      openDeleteEventModal(eventId, title)
    }

    const onEventDragged = async (qEvent) => {
      const eventId = resolveQalendarEventId(qEvent)
      if (!eventId) return
      const db = events.value.find(e => e.id === eventId)
      if (db && !canEditTag(db.tag_id)) {
        loadError.value = calendarEditDeniedMessage
        await refreshEvents()
        return
      }
      try {
        await updateEvent(eventId, fromQalendarDrag(qEvent))
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message
        await refreshEvents()
      }
    }

    const onEventResized = onEventDragged

    const openDeleteCalendarModal = () => {
      if (!canDeleteCalendar.value) return
      showDeleteCalendarModal.value = true
    }

    let shareSearchTimer = null
    const loadShareUsers = async () => {
      shareLoadingUsers.value = true
      shareSearchError.value = ''
      try {
        shareUsers.value = await searchUsers(shareSearchQuery.value, userId.value)
      } catch (err) {
        shareSearchError.value = err.message || 'Failed to load users'
        shareUsers.value = []
      } finally {
        shareLoadingUsers.value = false
      }
    }

    watch(shareSearchQuery, () => {
      if (!showShareCalendarModal.value) return
      clearTimeout(shareSearchTimer)
      shareSearchTimer = setTimeout(loadShareUsers, 250)
    })

    watch(activeTagId, () => {
      if (showCalendarInfoPanel.value) closeCalendarInfoPanel()
    })

    const isShareUserSelected = (user) => shareSelectedUserIds.value.includes(user.id)
    const isShareUserAlreadyMember = (user) => {
      const email = (user.email || '').toLowerCase()
      return email ? memberEmails.value.has(email) : false
    }

    const toggleShareUser = (user) => {
      if (isShareUserAlreadyMember(user)) return
      const ids = shareSelectedUserIds.value
      if (ids.includes(user.id)) {
        shareSelectedUserIds.value = ids.filter(id => id !== user.id)
      } else {
        shareSelectedUserIds.value = [...ids, user.id]
      }
    }

    const memberLabel = (member) => {
      const email = member.user_email || ''
      return email.split('@')[0] || email
    }

    const memberRoleLabel = (role) => {
      if (role === 'owner') return 'Owner'
      if (role === 'editor') return 'Admin'
      if (role === 'viewer') return 'Member'
      return 'Member'
    }

    const memberRoleClass = (role) => {
      if (role === 'owner') return 'owner'
      if (role === 'editor') return 'admin'
      if (role === 'viewer') return 'member'
      return 'member'
    }

    const calendarEditDeniedMessage = 'You do not have permission to edit events on this calendar.'

    const memberInitial = (member) => {
      const label = memberLabel(member)
      return (label.charAt(0) || '?').toUpperCase()
    }

    const canRemoveMember = (member) => member.role !== 'owner'

    const refreshInfoMembers = async () => {
      if (!activeTagId.value) {
        infoCalendarMembers.value = []
        return
      }
      infoLoadingMembers.value = true
      try {
        infoCalendarMembers.value = await getMembers(activeTagId.value)
        shareCalendarMembers.value = infoCalendarMembers.value
      } catch (err) {
        infoCalendarMembers.value = []
        loadError.value = err.message || 'Failed to load calendar members'
      } finally {
        infoLoadingMembers.value = false
      }
    }

    const closeCalendarInfoPanel = () => {
      showCalendarInfoPanel.value = false
      infoRemoveMode.value = false
      infoSelectedMemberIds.value = []
    }

    const openCalendarInfoPanel = async () => {
      if (!canOpenCalendarInfo.value) return
      showCalendarInfoPanel.value = true
      infoRemoveMode.value = false
      infoSelectedMemberIds.value = []
      loadError.value = ''
      await refreshInfoMembers()
    }

    const openShareFromInfo = () => {
      if (!canManageCalendar.value) return
      openShareCalendarModal()
    }

    const openDeleteFromInfo = () => {
      if (!canManageCalendar.value) return
      openDeleteCalendarModal()
    }

    const startInfoRemoveMode = () => {
      if (!canManageCalendar.value) return
      infoRemoveMode.value = true
      infoSelectedMemberIds.value = []
    }

    const cancelInfoRemoveMode = () => {
      infoRemoveMode.value = false
      infoSelectedMemberIds.value = []
    }

    const toggleInfoMemberSelection = (memberId) => {
      const ids = infoSelectedMemberIds.value
      if (ids.includes(memberId)) {
        infoSelectedMemberIds.value = ids.filter(id => id !== memberId)
      } else {
        infoSelectedMemberIds.value = [...ids, memberId]
      }
    }

    const openRemoveMembersModal = () => {
      if (!infoSelectedMemberIds.value.length) return
      membersToRemove.value = infoCalendarMembers.value.filter(m =>
        infoSelectedMemberIds.value.includes(m.id)
      )
      showRemoveMembersModal.value = true
    }

    const performRemoveMembers = async () => {
      if (!membersToRemove.value.length) return
      saving.value = true
      loadError.value = ''
      try {
        for (const member of membersToRemove.value) {
          await removeMember(member.id)
        }
        showRemoveMembersModal.value = false
        membersToRemove.value = []
        infoSelectedMemberIds.value = []
        infoRemoveMode.value = false
        await refreshInfoMembers()
      } catch (err) {
        loadError.value = err.message || 'Failed to remove members'
      } finally {
        saving.value = false
      }
    }

    const openShareCalendarModal = async () => {
      if (!canManageCalendar.value) return
      showShareCalendarModal.value = true
      shareSearchQuery.value = ''
      shareSelectedUserIds.value = []
      shareSearchError.value = ''
      shareInviteRole.value = 'admin'
      loadError.value = ''
      try {
        await refreshInfoMembers()
      } catch {
        shareCalendarMembers.value = []
      }
      await loadShareUsers()
    }

    const closeShareCalendarModal = () => {
      showShareCalendarModal.value = false
      shareSelectedUserIds.value = []
      shareSearchError.value = ''
      shareInviteRole.value = 'admin'
    }

    const performShareCalendar = async () => {
      if (!activeTagId.value || !shareSelectedEmails.value.length) return
      saving.value = true
      loadError.value = ''
      try {
        await inviteMembers(
          activeTagId.value,
          shareSelectedEmails.value,
          shareRoleToDbRole(shareInviteRole.value)
        )
        await refreshInfoMembers()
        shareSelectedUserIds.value = []
        closeShareCalendarModal()
      } catch (err) {
        loadError.value = err.message || 'Failed to share calendar'
      } finally {
        saving.value = false
      }
    }

    const onTagDragStart = (event, index) => {
      tagDragIndex.value = index
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(index))
    }

    const onTagDragOver = (event, index) => {
      event.dataTransfer.dropEffect = 'move'
      tagDropIndex.value = index
    }

    const onTagDragEnd = () => {
      tagDragIndex.value = null
      tagDropIndex.value = null
    }

    const onTagDrop = async (event, dropIndex) => {
      const fromIndex = tagDragIndex.value
      onTagDragEnd()
      if (fromIndex === null || fromIndex === dropIndex) return

      const reordered = [...tags.value]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(dropIndex, 0, moved)

      try {
        await updateTagOrder(
          userId.value,
          userEmail.value,
          reordered.map(t => t.id)
        )
      } catch (err) {
        loadError.value = err.message || 'Failed to reorder calendars'
      }
    }

    const performDeleteCalendar = async () => {
      const cal = activeCalendar.value
      if (!cal || cal.owner_id !== userId.value) return
      saving.value = true
      loadError.value = ''
      try {
        await deleteTag(cal.id)
        showDeleteCalendarModal.value = false
        closeCalendarInfoPanel()
        activeTagId.value = null
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message || 'Failed to delete calendar'
      } finally {
        saving.value = false
      }
    }

    return {
      loading,
      loadError,
      saving,
      tags,
      activeTagId,
      calendarWrapperRef,
      dragPreview,
      activeCalendar,
      canDeleteCalendar,
      canOpenCalendarInfo,
      canManageCalendar,
      isInvitedCalendar,
      calendarInfoTypeLabel,
      calendarOwnerLabel,
      currentUserCalendarRole,
      calendarCreatedLabel,
      removableMembersCount,
      showCalendarInfoPanel,
      infoCalendarMembers,
      infoLoadingMembers,
      infoRemoveMode,
      infoSelectedMemberIds,
      showRemoveMembersModal,
      membersToRemove,
      openCalendarInfoPanel,
      closeCalendarInfoPanel,
      openShareFromInfo,
      openDeleteFromInfo,
      startInfoRemoveMode,
      cancelInfoRemoveMode,
      toggleInfoMemberSelection,
      openRemoveMembersModal,
      performRemoveMembers,
      canRemoveMember,
      memberRoleLabel,
      memberRoleClass,
      memberInitial,
      canEditCalendarEvents,
      isPersonalTag,
      isSharedTag,
      calendarTagStyle,
      truncateTagLabel,
      tagDragIndex,
      tagDropIndex,
      showShareCalendarModal,
      shareSearchQuery,
      shareSearchError,
      shareInviteRole,
      shareLoadingUsers,
      filteredShareUsers,
      shareCalendarMembers,
      shareSelectedEmails,
      calendarDeleteEventCount,
      qalendarEvents,
      qalendarConfig,
      formatWeekEventTime,
      showWeekEventTime,
      showWeekEventCreator,
      weekEventBlockStyle,
      showEventModal,
      showCreateCalendarModal,
      showDeleteCalendarModal,
      showDeleteEventModal,
      eventToDelete,
      cancelDeleteEvent,
      performDeleteEvent,
      editingEventId,
      eventForm,
      eventStartTime,
      eventEndTime,
      datePickerBind,
      timePickerBind,
      timePickerConfig,
      eventTagStyle,
      newCalendarName,
      newCalendarColor,
      colorPalette,
      userId,
      openCreateCalendarModal,
      saveNewCalendar,
      openNewEvent,
      onEditEvent,
      onDeleteEvent,
      onEventDragged,
      onEventResized,
      onPeriodUpdated,
      closeEventModal,
      saveEvent,
      setEventAllDay,
      confirmDeleteEvent,
      openDeleteCalendarModal,
      performDeleteCalendar,
      openShareCalendarModal,
      closeShareCalendarModal,
      performShareCalendar,
      isShareUserSelected,
      isShareUserAlreadyMember,
      toggleShareUser,
      memberLabel,
      onTagDragStart,
      onTagDragOver,
      onTagDragEnd,
      onTagDrop
    }
  }
}
</script>

<style scoped>
.calendar-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  background: #f8f9fa;
}

.calendar-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
}

.calendar-topbar__head h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.calendar-topbar__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.calendar-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.calendar-sidebar {
  flex-shrink: 0;
  width: 130px;
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  background: #fff;
  border-right: 1px solid #e9ecef;
  overflow-x: visible;
  overflow-y: hidden;
}

.calendar-sidebar__tags {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calendar-sidebar__tags-label {
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #6c757d;
}

.calendar-tag-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 2px;
  overflow-x: visible;
  overflow-y: auto;
  min-height: 0;
}

.calendar-tag-list .folder-tag {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  max-height: 34px;
  padding: 6px 10px;
  border-radius: 16px;
  border: 1px solid transparent;
  text-align: left;
  text-transform: none;
  letter-spacing: normal;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.calendar-tag-list .folder-tag.active {
  box-shadow: none;
  border-width: 2px;
  padding: 5px 9px;
}

.calendar-tag-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow: hidden;
}

.subtitle {
  color: #6c757d;
  font-size: 13px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #333;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary.btn-sm {
  padding: 10px 14px;
  font-size: 13px;
  flex-shrink: 0;
}

.btn-secondary {
  padding: 10px 18px;
  background: #f8f9fa;
  color: #1a1a1a;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-danger-outline {
  padding: 10px 18px;
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-outline:hover {
  background: #dc3545;
  color: #fff;
}

.calendar-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
  text-transform: none;
  letter-spacing: normal;
}

.calendar-action-create {
  background: #1a1a1a;
  color: #fff;
  border: 1px solid #1a1a1a;
}

.calendar-action-create:hover {
  background: #333;
  border-color: #333;
}

.calendar-action-delete {
  background: #fff;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.calendar-action-delete:hover:not(:disabled) {
  background: #dc3545;
  color: #fff;
}

.calendar-action-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.calendar-action-share {
  background: #fff;
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.calendar-action-share:hover:not(:disabled) {
  background: #4f46e5;
  color: #fff;
}

.calendar-action-share:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.calendar-action-info {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.calendar-action-info:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.calendar-action-info:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.calendar-info-modal {
  display: flex;
  flex-direction: column;
  max-width: 480px;
  width: 100%;
  max-height: min(85vh, 720px);
  padding: 0;
  overflow: hidden;
}

.calendar-info-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 12px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.calendar-info-modal-head h3 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 600;
  color: #1a1a1a;
}

.calendar-info-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.calendar-info-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.calendar-info-type {
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #4f46e5;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.calendar-info-type.is-shared {
  color: #7c3aed;
}

.calendar-info-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 0;
}

.calendar-info-section + .calendar-info-section {
  margin-top: 28px;
}

.calendar-info-section h3 {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.calendar-info-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.calendar-info-section-head h3 {
  margin: 0;
}

.calendar-info-count {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 999px;
}

.calendar-info-details {
  margin: 0;
}

.calendar-info-detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f3f5;
  font-size: 14px;
}

.calendar-info-detail-row dt {
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

.calendar-info-detail-row dd {
  margin: 0;
  color: #1a1a1a;
  text-align: right;
}

.calendar-info-hint {
  margin: 14px 0 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.calendar-info-loading,
.calendar-info-empty {
  font-size: 13px;
  color: #6b7280;
  padding: 8px 0;
}

.calendar-info-members {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.calendar-info-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f3f5;
}

.calendar-info-member:last-child {
  border-bottom: none;
}

.calendar-info-member.selectable {
  cursor: pointer;
}

.calendar-info-member.selectable:hover {
  background: #f9fafb;
}

.calendar-info-member-checkbox {
  flex-shrink: 0;
}

.calendar-info-member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.calendar-info-member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calendar-info-member-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.calendar-info-member-email {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-info-member-role {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.calendar-info-member-role.role-owner {
  background: #fef3c7;
  color: #92400e;
}

.calendar-info-member-role.role-admin {
  background: #eef2ff;
  color: #4338ca;
}

.calendar-info-member-role.role-member {
  background: #f3f4f6;
  color: #4b5563;
}

.calendar-info-footer {
  display: flex;
  gap: 10px;
  padding: 14px 20px 20px;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

.calendar-info-action-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.calendar-info-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.calendar-info-action-share {
  background: #fff;
  color: #4f46e5;
  border-color: #4f46e5;
}

.calendar-info-action-share:hover:not(:disabled) {
  background: #4f46e5;
  color: #fff;
}

.calendar-info-action-remove {
  background: #fff;
  color: #b45309;
  border-color: #f59e0b;
}

.calendar-info-action-remove:hover:not(:disabled) {
  background: #f59e0b;
  color: #fff;
}

.calendar-info-action-delete {
  background: #fff;
  color: #dc3545;
  border-color: #dc3545;
}

.calendar-info-action-delete:hover:not(:disabled) {
  background: #dc3545;
  color: #fff;
}

.calendar-info-remove-preview {
  list-style: none;
  margin: 0 0 16px;
  padding: 12px 14px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
}

.calendar-info-remove-preview li + li {
  margin-top: 6px;
}

.calendar-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: grab;
}

.calendar-tag:active {
  cursor: grabbing;
}

.calendar-tag.tag-personal {
  background: #f0f0f0;
}

.calendar-tag.tag-shared {
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
  border-style: dashed;
  font-style: normal;
}

.calendar-tag.tag-shared .tag-shared-icon {
  display: inline-flex;
  opacity: 0.75;
}

.calendar-tag.tag-dragging {
  opacity: 0.45;
}

.calendar-tag.tag-drag-over {
  box-shadow: 0 0 0 2px #4f46e5;
}

.share-modal-hint {
  font-size: 13px;
  color: #6c757d;
  margin: -12px 0 16px;
}

.share-role-group {
  margin-bottom: 16px;
}

.share-role-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-role-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.share-role-option:hover {
  border-color: #c7d2fe;
  background: #fafbff;
}

.share-role-option.active {
  border-color: #4f46e5;
  background: #eef2ff;
}

.share-role-option input {
  margin-top: 3px;
  flex-shrink: 0;
}

.share-role-option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.share-role-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.share-role-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.share-search-error {
  font-size: 13px;
  color: #c0392b;
  margin-bottom: 8px;
}

.share-loading,
.share-empty {
  font-size: 13px;
  color: #6c757d;
  padding: 12px 0;
}

.share-user-list {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 12px;
}

.share-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
  transition: background 0.15s;
}

.share-user-row:last-child {
  border-bottom: none;
}

.share-user-row:hover:not(.disabled) {
  background: #f8f9fa;
}

.share-user-row.selected {
  background: #eef2ff;
}

.share-user-row.disabled {
  opacity: 0.65;
  cursor: default;
}

.share-user-checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: #4f46e5;
}

.share-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.share-user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.share-user-email {
  font-size: 12px;
  color: #6c757d;
}

.share-user-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #4f46e5;
  background: #eef2ff;
  padding: 4px 8px;
  border-radius: 999px;
}

.share-current {
  margin-bottom: 16px;
}

.share-current-label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.share-current-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.share-chip {
  font-size: 12px;
  padding: 4px 10px;
  background: #f1f3f5;
  border-radius: 999px;
  color: #495057;
}

.btn-danger {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-warning {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-actions-confirm {
  justify-content: space-between;
}

/* Matches folder-tag / card-badge from Library & Home */
.folder-tag {
  display: inline-block;
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  border: 1px solid transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.folder-tag:hover {
  opacity: 0.85;
}

.folder-tag.active {
  box-shadow: 0 0 0 2px currentColor;
}

.calendar-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.calendar-wrapper :deep(.vine-week-event) {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 3px 5px;
  border-radius: 4px;
  overflow: hidden;
  box-sizing: border-box;
  line-height: 1.15;
  cursor: pointer;
}

.calendar-wrapper :deep(.vine-week-event__title) {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-wrapper :deep(.vine-week-event__time),
.calendar-wrapper :deep(.vine-week-event__creator) {
  font-size: 10px;
  margin: 0;
  opacity: 0.92;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-preview {
  position: absolute;
  background: rgba(26, 26, 26, 0.15);
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  pointer-events: none;
  z-index: 50;
}

.error-banner {
  padding: 12px 16px;
  background: #fdecea;
  color: #c0392b;
  border-radius: 10px;
  font-size: 13px;
}

/* Modal — matches LibScreen */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
}

.modal {
  background: white;
  padding: 32px;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-wide {
  max-width: 480px;
}

.modal h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.optional {
  font-weight: 400;
  color: #adb5bd;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: #fff;
}

.input:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-row .form-group {
  margin-bottom: 0;
}

.event-modal {
  max-width: 480px;
}

.event-tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-hint {
  font-size: 13px;
  color: #6c757d;
  margin: 0;
}

.time-section .form-group {
  margin-bottom: 12px;
}

.event-date-picker {
  width: 100%;
  --dp-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --dp-border-radius: 10px;
  --dp-cell-border-radius: 8px;
  --dp-primary-color: #1a1a1a;
  --dp-primary-text-color: #fff;
  --dp-hover-color: #f1f3f5;
  --dp-hover-text-color: #1a1a1a;
}

.event-date-picker :deep(.dp__input_wrap) {
  width: 100%;
}

.event-date-picker :deep(.dp__input) {
  padding: 12px 36px 12px 56px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  min-height: 44px;
  width: 100%;
  background: #fff;
  color: #1a1a1a;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.event-date-picker :deep(.dp__input_icon) {
  inset-inline-start: 16px;
}

.event-date-picker :deep(.dp__input_icon svg),
.event-date-picker :deep(.dp__input_icons) {
  width: 18px;
  height: 18px;
}

.event-date-picker :deep(.dp--clear-btn) {
  inset-inline-end: 10px;
}

.event-date-picker :deep(.dp__input:hover) {
  border-color: #ced4da;
}

.event-date-picker :deep(.dp__input:focus) {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}

.event-date-picker :deep(.dp__menu) {
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.event-date-picker :deep(.dp__action_select) {
  background: #1a1a1a;
}

.event-time-picker :deep(.dp__input) {
  min-height: 44px;
  padding: 12px 36px 12px 56px;
  font-size: 14px;
}

.time-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.time-section-header > label:first-child {
  display: block;
  margin-bottom: 0;
}

.time-section-header .toggle-label.compact {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  cursor: pointer;
}

.sub-label {
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
}

.toggle-label.compact {
  font-size: 13px;
  font-weight: 500;
}

.toggle-track {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
}

.toggle-text {
  line-height: 1;
  white-space: nowrap;
  user-select: none;
}

.color-palette {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
}

.color-circle:hover {
  transform: scale(1.15);
}

.color-circle.active {
  border-color: #ccc;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #ccc;
}

.toggle-row {
  margin-bottom: 16px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 0 !important;
}

.toggle-checkbox {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  background: #e9ecef;
  border-radius: 11px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
  pointer-events: none;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-checkbox:checked + .toggle-switch {
  background: #1a1a1a;
}

.toggle-checkbox:checked + .toggle-switch::after {
  transform: translateX(18px);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
}

.modal-actions-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .calendar-page {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  .calendar-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .calendar-topbar__actions {
    flex-wrap: wrap;
  }

  .calendar-body {
    flex-direction: column;
    overflow: visible;
  }

  .calendar-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
    max-height: 240px;
  }

  .calendar-tag-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .calendar-tag-list .folder-tag {
    width: 100%;
    max-width: none;
  }

  .calendar-main {
    min-height: 60vh;
    overflow: visible;
  }

  .calendar-wrapper {
    min-height: 420px;
  }
}
</style>

<!-- Teleported time-picker menu (ui.menu class); scoped styles do not apply -->
<style>
.dp__menu.event-time-picker-menu {
  --dp-time-font-size: 1rem;
  --dp-time-inc-dec-button-size: 22px;
  --dp-menu-min-width: 260px;
  width: auto;
  min-width: 260px;
  max-width: 300px;
  height: auto !important;
  overflow: visible;
}

.dp__menu.event-time-picker-menu .dp__menu_inner {
  padding: 12px 16px;
}

/* Library sets inline height ~255px on this wrapper; it hid all digits when display:none */
.dp__menu.event-time-picker-menu .dp__overlay {
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  position: relative !important;
}

.dp__menu.event-time-picker-menu .dp__time_picker_overlay_container,
.dp__menu.event-time-picker-menu .dp__overlay_row {
  height: auto !important;
  min-height: 0 !important;
}

.dp__menu.event-time-picker-menu .dp__time_input {
  flex-direction: row !important;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 0 !important;
  height: auto !important;
  padding: 0;
}

.dp__menu.event-time-picker-menu .dp__time_col {
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center;
  gap: 4px;
  min-height: 0 !important;
  height: auto !important;
}

.dp__menu.event-time-picker-menu .dp__time_col_reg_block,
.dp__menu.event-time-picker-menu .dp__time_col_reg_inline,
.dp__menu.event-time-picker-menu .dp__time_col_reg_with_button {
  padding: 0 8px;
}

.dp__menu.event-time-picker-menu .dp__time_col_block,
.dp__menu.event-time-picker-menu .dp__time_display {
  font-size: var(--dp-time-font-size);
  line-height: 1.2;
  color: var(--dp-text-color, #212121);
}

.dp__menu.event-time-picker-menu .dp__time_display {
  min-width: 1.75rem;
  padding: 10px;
}

.dp__menu.event-time-picker-menu .dp__inc_dec_button {
  width: var(--dp-time-inc-dec-button-size);
  height: var(--dp-time-inc-dec-button-size);
  padding: 0;
  margin: 0;
}

.dp__menu.event-time-picker-menu .dp__inc_dec_button svg {
  width: 14px;
  height: 14px;
}

.dp__menu.event-time-picker-menu .dp__action_row {
  display: none;
}
</style>
