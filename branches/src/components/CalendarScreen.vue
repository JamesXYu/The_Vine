<template>
  <div class="calendar-page">
    <header class="page-header">
      <div class="header-left">
        <h1>Calendar</h1>
        <p class="subtitle">Each calendar groups events by tag — share with collaborators</p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="calendar-action-btn calendar-action-create"
          @click="openCreateCalendarModal"
        >
          Create
        </button>
        <button
          type="button"
          class="calendar-action-btn calendar-action-delete"
          :disabled="!canDeleteCalendar"
          @click="openDeleteCalendarModal"
        >
          Delete
        </button>
        <button class="btn-primary" @click="openNewEvent()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add event
        </button>
      </div>
    </header>

    <section class="calendar-tags-bar">
      <div class="calendar-bar-filters">
        <button
          type="button"
          class="folder-tag"
          :class="{ active: activeTagId === null }"
          @click="activeTagId = null"
        >
          All calendars
        </button>
        <button
          v-for="tag in tags"
          :key="tag.id"
          type="button"
          class="folder-tag"
          :class="{ active: activeTagId === tag.id }"
          :style="{ color: tag.color, borderColor: tag.color }"
          @click="activeTagId = tag.id"
        >
          {{ tag.name }}
        </button>
      </div>
    </section>

    <div v-if="loadError" class="error-banner">{{ loadError }}</div>

    <div class="calendar-wrapper is-light-mode">
      <Qalendar
        :events="qalendarEvents"
        :config="qalendarConfig"
        :is-loading="loading"
        @edit-event="onEditEvent"
        @delete-event="onDeleteEvent"
        @event-was-dragged="onEventDragged"
        @event-was-resized="onEventResized"
        @datetime-was-clicked="onDateTimeClicked"
        @date-was-clicked="onDateClicked"
      />
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
      <div class="modal" :class="{ 'modal-wide': showShareSection }">
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

          <div class="form-group" v-if="!editingEventId">
            <label>Calendar</label>
            <div class="calendar-mode-tabs">
              <button
                type="button"
                class="mode-tab"
                :class="{ active: calendarMode === 'existing' }"
                @click="calendarMode = 'existing'"
              >
                Existing
              </button>
              <button
                type="button"
                class="mode-tab"
                :class="{ active: calendarMode === 'new' }"
                @click="calendarMode = 'new'"
              >
                New calendar
              </button>
            </div>
          </div>

          <div v-if="calendarMode === 'existing' || editingEventId" class="form-group">
            <label>{{ editingEventId ? 'Calendar' : 'Choose calendar' }}</label>
            <select v-model="eventForm.tagId" class="input" required>
              <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                {{ tag.name }}
              </option>
            </select>
          </div>

          <template v-if="calendarMode === 'new' && !editingEventId">
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
          </template>

          <div class="form-group toggle-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="eventForm.allDay" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              <span>All day event</span>
            </label>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start</label>
              <input
                v-model="eventForm.start"
                :type="eventForm.allDay ? 'date' : 'datetime-local'"
                class="input"
                required
              />
            </div>
            <div class="form-group">
              <label>End</label>
              <input
                v-model="eventForm.end"
                :type="eventForm.allDay ? 'date' : 'datetime-local'"
                class="input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>Location <span class="optional">(optional)</span></label>
            <input
              v-model="eventForm.location"
              type="text"
              class="input"
              placeholder="Add a location"
            />
          </div>

          <div class="form-group">
            <label>Description <span class="optional">(optional)</span></label>
            <textarea
              v-model="eventForm.description"
              class="input textarea"
              rows="3"
              placeholder="Add details about this event"
            ></textarea>
          </div>

          <div
            v-if="selectedCalendar && selectedCalendar.owner_id === userId"
            class="share-section"
          >
            <button
              type="button"
              class="share-toggle"
              @click="showShareSection = !showShareSection"
            >
              <span>Share calendar</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                :class="{ rotated: showShareSection }"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div v-if="showShareSection" class="share-panel">
              <p class="share-hint">Invite others to view or edit events on “{{ selectedCalendar.name }}”.</p>
              <div class="invite-row">
                <input
                  v-model="inviteEmail"
                  type="email"
                  class="input"
                  placeholder="member@email.com"
                />
                <select v-model="inviteRole" class="input input-compact">
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="button" class="btn-primary btn-sm" :disabled="saving" @click="inviteCollaborator">
                  Invite
                </button>
              </div>
              <ul v-if="members.length" class="member-list">
                <li v-for="m in members" :key="m.id">
                  <span>{{ m.user_email }}</span>
                  <span class="role-badge">{{ m.role }}</span>
                  <button
                    v-if="m.role !== 'owner'"
                    type="button"
                    class="btn-text-danger"
                    @click="removeCollaborator(m.id)"
                  >
                    Remove
                  </button>
                </li>
              </ul>
            </div>
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
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save event' }}
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
import { supabase } from '../supabase'
import { useCalendarEvents, snapTo15Minutes } from '../composables/useCalendarEvents'

function toLocalInput(iso, allDay) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (allDay) return `${y}-${m}-${day}`
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

function fromLocalInput(value, allDay) {
  if (allDay) return new Date(value + 'T00:00:00').toISOString()
  return new Date(value).toISOString()
}

const colorPalette = [
  '#ff6b6b', '#ff8c42', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e',
  '#577590', '#9B5DE5', '#f15bb5', '#fee440', '#00BBF9', '#00F5D4',
  '#9C89B8', '#EF476F', '#FFD166', '#06D6A0'
]

export default {
  name: 'CalendarScreen',
  components: { Qalendar },
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
    const showShareSection = ref(false)
    const editingEventId = ref(null)
    const calendarMode = ref('existing')
    const newCalendarName = ref('')
    const newCalendarColor = ref('#6b7280')
    const inviteEmail = ref('')
    const inviteRole = ref('editor')

    const eventForm = ref({
      title: '',
      tagId: '',
      allDay: false,
      start: '',
      end: '',
      location: '',
      description: ''
    })

    const {
      loading,
      tags,
      events,
      members,
      getTags,
      createTag,
      deleteTag,
      getMembers,
      inviteMember,
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

    const selectedCalendar = computed(() =>
      tags.value.find(t => t.id === eventForm.value.tagId) || null
    )

    const activeCalendar = computed(() =>
      tags.value.find(t => t.id === activeTagId.value) || null
    )

    const canDeleteCalendar = computed(() => {
      const cal = activeCalendar.value
      return Boolean(cal && cal.owner_id === userId.value)
    })

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
        week: { startsOn: 'sunday', nDays: 7 },
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

      await getTags(user.id, user.email)
      calendarMode.value = tags.value.length ? 'existing' : 'new'
      if (tags.value.length) {
        eventForm.value.tagId = tags.value[0].id
      }
      await refreshEvents()
    }

    watch(() => eventForm.value.tagId, async (tagId) => {
      if (tagId && showEventModal.value) {
        await getMembers(tagId)
      }
    })

    let unsubscribe = null
    onMounted(async () => {
      await init()
      unsubscribe = subscribeToEvents(refreshEvents)
    })
    onUnmounted(() => {
      if (unsubscribe) unsubscribe()
    })

    const resetEventForm = (startHint, endHint) => {
      const now = snapTo15Minutes(new Date())
      let start = now
      let endDate = snapTo15Minutes(new Date(now.getTime() + 60 * 60 * 1000))
      let allDay = false

      if (startHint) {
        allDay = !String(startHint).includes(' ')
        if (allDay) {
          start = new Date(startHint + 'T00:00:00')
          endDate = new Date(startHint + 'T00:00:00')
        } else {
          start = snapTo15Minutes(new Date(String(startHint).replace(' ', 'T') + ':00'))
          if (endHint && String(endHint).includes(' ')) {
            endDate = snapTo15Minutes(new Date(String(endHint).replace(' ', 'T') + ':00'))
          } else {
            endDate = snapTo15Minutes(new Date(start.getTime() + 60 * 60 * 1000))
          }
        }
      }

      eventForm.value = {
        title: '',
        tagId: activeTagId.value || tags.value[0]?.id || '',
        allDay,
        start: toLocalInput(start.toISOString(), allDay),
        end: toLocalInput(endDate.toISOString(), allDay),
        location: '',
        description: ''
      }
      calendarMode.value = tags.value.length ? 'existing' : 'new'
      newCalendarName.value = ''
      newCalendarColor.value = '#6b7280'
      inviteEmail.value = ''
      showShareSection.value = false
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
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message || 'Failed to create calendar'
      } finally {
        saving.value = false
      }
    }

    const openNewEvent = (startHint) => {
      editingEventId.value = null
      resetEventForm(startHint)
      showEventModal.value = true
      if (eventForm.value.tagId) getMembers(eventForm.value.tagId)
    }

    const onEditEvent = (qEvent) => {
      const db = events.value.find(e => e.id === qEvent.id)
      if (!db) return
      editingEventId.value = db.id
      calendarMode.value = 'existing'
      eventForm.value = {
        title: db.title,
        tagId: db.tag_id,
        allDay: db.all_day,
        start: toLocalInput(db.start_at, db.all_day),
        end: toLocalInput(db.end_at, db.all_day),
        location: db.location || '',
        description: db.description || ''
      }
      showEventModal.value = true
      getMembers(db.tag_id)
    }

    const closeEventModal = () => {
      showEventModal.value = false
      editingEventId.value = null
    }

    const resolveTagId = async () => {
      if (calendarMode.value === 'new' && !editingEventId.value) {
        const name = newCalendarName.value.trim()
        if (!name) throw new Error('Calendar name is required')
        const tag = await createTag(
          userId.value,
          userEmail.value,
          name,
          newCalendarColor.value
        )
        eventForm.value.tagId = tag.id
        return tag.id
      }
      if (!eventForm.value.tagId) throw new Error('Please select a calendar')
      return eventForm.value.tagId
    }

    const saveEvent = async () => {
      saving.value = true
      loadError.value = ''
      try {
        const tagId = await resolveTagId()
        const payload = {
          tagId,
          title: eventForm.value.title,
          description: eventForm.value.description,
          location: eventForm.value.location,
          startAt: fromLocalInput(eventForm.value.start, eventForm.value.allDay),
          endAt: fromLocalInput(eventForm.value.end, eventForm.value.allDay),
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

    const confirmDeleteEvent = async () => {
      if (!editingEventId.value || !confirm('Delete this event?')) return
      saving.value = true
      try {
        await deleteEvent(editingEventId.value)
        closeEventModal()
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message
      } finally {
        saving.value = false
      }
    }

    const onDeleteEvent = async (qEvent) => {
      if (!confirm('Delete this event?')) return
      try {
        await deleteEvent(qEvent.id)
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message
      }
    }

    const onEventDragged = async (qEvent) => {
      try {
        await updateEvent(qEvent.id, fromQalendarDrag(qEvent))
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message
        await refreshEvents()
      }
    }

    const onEventResized = onEventDragged
    const onDateTimeClicked = (dt) => openNewEvent(dt)
    const onDateClicked = (date) => openNewEvent(date)
    const openDeleteCalendarModal = () => {
      if (!canDeleteCalendar.value) return
      showDeleteCalendarModal.value = true
    }

    const performDeleteCalendar = async () => {
      const cal = activeCalendar.value
      if (!cal || cal.owner_id !== userId.value) return
      saving.value = true
      loadError.value = ''
      try {
        await deleteTag(cal.id)
        showDeleteCalendarModal.value = false
        activeTagId.value = null
        await refreshEvents()
      } catch (err) {
        loadError.value = err.message || 'Failed to delete calendar'
      } finally {
        saving.value = false
      }
    }

    const inviteCollaborator = async () => {
      const tagId = eventForm.value.tagId
      if (!tagId || !inviteEmail.value.trim()) return
      saving.value = true
      try {
        await inviteMember(tagId, inviteEmail.value, inviteRole.value)
        inviteEmail.value = ''
        await getMembers(tagId)
      } catch (err) {
        loadError.value = err.message
      } finally {
        saving.value = false
      }
    }

    const removeCollaborator = async (memberId) => {
      try {
        await removeMember(memberId)
        if (eventForm.value.tagId) await getMembers(eventForm.value.tagId)
      } catch (err) {
        loadError.value = err.message
      }
    }

    return {
      loading,
      loadError,
      saving,
      tags,
      members,
      activeTagId,
      activeCalendar,
      canDeleteCalendar,
      calendarDeleteEventCount,
      qalendarEvents,
      qalendarConfig,
      showEventModal,
      showCreateCalendarModal,
      showDeleteCalendarModal,
      showShareSection,
      editingEventId,
      calendarMode,
      eventForm,
      newCalendarName,
      newCalendarColor,
      colorPalette,
      inviteEmail,
      inviteRole,
      userId,
      selectedCalendar,
      openCreateCalendarModal,
      saveNewCalendar,
      openNewEvent,
      onEditEvent,
      onDeleteEvent,
      onEventDragged,
      onEventResized,
      onDateTimeClicked,
      onDateClicked,
      closeEventModal,
      saveEvent,
      confirmDeleteEvent,
      openDeleteCalendarModal,
      performDeleteCalendar,
      inviteCollaborator,
      removeCollaborator
    }
  }
}
</script>

<style scoped>
.calendar-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32px;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
  gap: 16px;
}

.header-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.subtitle {
  color: #6c757d;
  font-size: 14px;
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

.calendar-tags-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.calendar-bar-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.calendar-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  flex: 1;
  min-height: 400px;
  height: calc(100vh - 200px);
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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
  z-index: 1000;
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

.calendar-mode-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 10px;
}

.mode-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-tab.active {
  background: #fff;
  color: #1a1a1a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  background: #e9ecef;
  border-radius: 11px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
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

.share-section {
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.share-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  cursor: pointer;
}

.share-toggle svg {
  transition: transform 0.2s;
}

.share-toggle svg.rotated {
  transform: rotate(180deg);
}

.share-panel {
  margin-top: 12px;
}

.share-hint {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 12px;
  line-height: 1.5;
}

.invite-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.invite-row .input {
  flex: 1;
  min-width: 140px;
}

.input-compact {
  flex: 0 0 100px;
  padding-left: 10px;
  padding-right: 10px;
}

.member-list {
  list-style: none;
  margin-top: 12px;
}

.member-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #f8f9fa;
}

.role-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 10px;
  color: #6c757d;
  text-transform: capitalize;
}

.btn-text-danger {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc3545;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
}

.btn-text-danger:hover {
  text-decoration: underline;
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

@media (max-width: 520px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .calendar-page {
    padding: 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-wrap: wrap;
    width: 100%;
  }
}
</style>
