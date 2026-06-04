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
              class="folder-tag calendar-all-btn"
              :class="{ active: activeTagId === null }"
              @click="activeTagId = null"
              title="All calendars"
            >
              All calendars
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
              <span class="calendar-tag-row">
                <span v-if="tag.is_shared" class="tag-shared-icon" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <span class="calendar-tag-label" :title="tag.name">{{ truncateTagLabel(tag.name) }}</span>
              </span>
              <span v-if="tag.is_shared" class="calendar-kind-badge">Shared</span>
            </button>
          </div>
        </section>
      </aside>

      <main class="calendar-main">
        <div v-if="loadError" class="error-banner">{{ loadError }}</div>

        <div
          ref="calendarWrapperRef"
          class="calendar-wrapper is-light-mode"
          :class="{ 'is-scroll-month': qalendarMode === 'month' }"
        >
          <Qalendar
            ref="qalendarRef"
            :events="qalendarEvents"
            :config="qalendarConfig"
            :selected-date="calendarPeriod.selectedDate"
            :is-loading="loading"
            @edit-event="onEditEvent"
            @delete-event="onDeleteEvent"
            @event-was-dragged="onEventDragged"
            @event-was-resized="onEventResized"
            @updated-period="onPeriodUpdated"
            @updated-mode="onQalendarModeUpdated"
          >
            <template #weekDayEvent="{ eventData }">
              <div
                class="vine-week-event"
                :class="weekEventRsvpClass(eventData)"
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
            <template #eventDialog="{ eventDialogData, closeEventDialog }">
              <EventFlyoutContent
                :q-event="eventDialogData"
                :db-event="dbEventById(eventDialogData?.id)"
                :saving="saving"
                :show-rsvp-actions="showFlyoutRsvpActions(eventDialogData?.id)"
                :can-edit="canOpenEventFlyoutEdit(eventDialogData?.id)"
                :can-delete="canDeleteFlyoutEvent(eventDialogData?.id)"
                @accept="handleFlyoutRsvp(eventDialogData?.id, 'accepted', closeEventDialog)"
                @reject="handleFlyoutRsvp(eventDialogData?.id, 'rejected', closeEventDialog)"
                @edit="flyoutOpenEdit(eventDialogData?.id, closeEventDialog)"
                @delete="flyoutOpenDelete(eventDialogData, closeEventDialog)"
                @close="closeEventDialog()"
              />
            </template>
          </Qalendar>
          <Teleport v-if="calendarHeaderTarget" :to="calendarHeaderTarget">
            <div class="calendar-view-toolbar" aria-label="Calendar view">
              <button
                type="button"
                class="calendar-view-nav"
                aria-label="Previous period"
                @click="navigateCalendarPeriod('previous')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <div class="calendar-view-modes" role="tablist">
                <button
                  v-for="opt in calendarViewModes"
                  :key="opt.id"
                  type="button"
                  role="tab"
                  class="calendar-view-mode"
                  :class="{ active: qalendarMode === opt.id }"
                  :aria-selected="qalendarMode === opt.id"
                  @click="setCalendarViewMode(opt.id)"
                >
                  {{ opt.label }}
                </button>
              </div>
              <button
                type="button"
                class="calendar-view-nav"
                aria-label="Next period"
                @click="navigateCalendarPeriod('next')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </Teleport>
          <CalendarScrollMonth
            v-if="qalendarMode === 'month'"
            :events="qalendarEvents"
            :color-schemes="qalendarConfig.style?.colorSchemes || {}"
            :selected-date="calendarPeriod.selectedDate"
            :root-ref="calendarWrapperRef"
            @select-event="onSelectMonthEvent"
            @updated-period="onScrollMonthPeriodUpdated"
          />
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
              <span class="calendar-info-count">{{ infoMemberCountLabel }}</span>
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
                :class="{
                  selectable: infoRemoveMode && canRemoveMember(member),
                  'is-pending-invite': isPendingCalendarMember(member)
                }"
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
                <span class="calendar-info-member-role" :class="`role-${memberStatusClass(member)}`">
                  {{ memberStatusLabel(member) }}
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
              class="calendar-info-action-btn calendar-info-action-edit"
              :disabled="!canManageCalendar"
              :title="!canManageCalendar ? 'Only the owner can edit' : 'Edit name and color'"
              @click="openEditFromInfo"
            >
              Edit
            </button>
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
            <span
              v-if="shareUserBadgeLabel(user)"
              class="share-user-badge"
              :class="{ 'is-pending': shareUserBadgeLabel(user) === 'Pending' }"
            >
              {{ shareUserBadgeLabel(user) }}
            </span>
          </li>
        </ul>
        <div v-if="shareAcceptedMembers.length" class="share-current">
          <p class="share-current-label">Members</p>
          <div class="share-current-chips">
            <span
              v-for="member in shareAcceptedMembers"
              :key="member.id"
              class="share-chip"
            >
              {{ memberLabel(member) }} · {{ memberRoleLabel(member.role) }}
            </span>
          </div>
        </div>
        <div v-if="sharePendingMembers.length" class="share-current share-current-pending">
          <p class="share-current-label">Pending invites</p>
          <div class="share-current-chips">
            <span
              v-for="member in sharePendingMembers"
              :key="member.id"
              class="share-chip is-pending"
            >
              {{ memberLabel(member) }} · {{ memberRoleLabel(member.role) }} (pending)
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

    <!-- Edit calendar modal -->
    <div v-if="showEditCalendarModal" class="modal-overlay" @click.self="showEditCalendarModal = false">
      <div class="modal">
        <h3>Edit calendar</h3>
        <form @submit.prevent="saveEditCalendar">
          <div class="form-group">
            <label>Calendar name</label>
            <input
              v-model="editCalendarName"
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
                :class="{ active: editCalendarColor === color }"
                :style="{ background: color }"
                @click.prevent="editCalendarColor = color"
                :title="color"
              >
                <svg
                  v-if="editCalendarColor === color"
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
              <button type="button" class="btn-secondary" @click="showEditCalendarModal = false">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </div>
        </form>
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

    <!-- Month view: event quick actions (same as Qalendar flyout) -->
    <div
      v-if="monthFlyoutEventId"
      class="modal-overlay month-event-flyout-overlay"
      @click.self="closeMonthFlyout"
    >
      <div class="month-event-flyout-panel">
        <EventFlyoutContent
          standalone
          :q-event="monthFlyoutQEvent"
          :db-event="monthFlyoutDbEvent"
          :saving="saving"
          :show-rsvp-actions="showFlyoutRsvpActions(monthFlyoutEventId)"
          :can-edit="canOpenEventFlyoutEdit(monthFlyoutEventId)"
          :can-delete="canDeleteFlyoutEvent(monthFlyoutEventId)"
          @accept="handleFlyoutRsvp(monthFlyoutEventId, 'accepted', closeMonthFlyout)"
          @reject="handleFlyoutRsvp(monthFlyoutEventId, 'rejected', closeMonthFlyout)"
          @edit="flyoutOpenEdit(monthFlyoutEventId, closeMonthFlyout)"
          @delete="flyoutOpenDelete(monthFlyoutQEvent, closeMonthFlyout)"
          @close="closeMonthFlyout"
        />
      </div>
    </div>

    <!-- Event modal -->
    <div v-if="showEventModal" class="modal-overlay event-modal-overlay" @click.self="closeEventModal">
      <div class="modal event-modal">
        <h3>{{ editingEventId ? (eventViewOnly ? 'Event details' : 'Edit event') : 'New event' }}</h3>

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
              :readonly="eventViewOnly"
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
                :disabled="eventViewOnly"
                @click="!eventViewOnly && (eventForm.tagId = tag.id)"
              >
                {{ tag.name }}
              </button>
            </div>
            <p v-else class="field-hint">Create a calendar with the Create button above.</p>
          </div>

          <div class="form-group time-section" :class="{ 'is-readonly': eventViewOnly }">
            <div class="time-section-header">
              <label>{{ eventForm.allDay ? 'Date' : 'Time' }}</label>
              <label v-if="!eventViewOnly" class="toggle-label compact">
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
            <template v-if="eventViewOnly">
              <p class="event-view-time">{{ formatEventViewTime(activeEditingEvent) }}</p>
            </template>
            <template v-else-if="eventForm.allDay">
              <div class="form-row">
                <div class="form-group">
                  <label class="sub-label">Start date</label>
                  <VueDatePicker
                    v-model="eventStartDateValue"
                    v-bind="datePickerBind"
                    class="event-date-picker"
                    placeholder="Start date"
                  />
                </div>
                <div class="form-group">
                  <label class="sub-label">End date</label>
                  <VueDatePicker
                    v-model="eventEndDateValue"
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
                  v-model="eventDateValue"
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
              :readonly="eventViewOnly"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button
              v-if="editingEventId && canEditActiveEvent"
              type="button"
              class="btn-danger-outline"
              @click="confirmDeleteEvent"
            >
              Delete
            </button>
            <div v-else></div>
            <div class="modal-actions-right">
              <button type="button" class="btn-secondary" @click="closeEventModal">
                {{ eventViewOnly ? 'Close' : 'Cancel' }}
              </button>
              <button
                v-if="!eventViewOnly"
                type="submit"
                class="btn-primary"
                :disabled="saving || !eventForm.tagId"
              >
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
import { ref, computed, watch, onMounted, onActivated, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Qalendar } from 'qalendar'
import 'qalendar/dist/style.css'
import '../styles/calendar-events.css'
import CalendarScrollMonth from './CalendarScrollMonth.vue'
import EventFlyoutContent from './EventFlyoutContent.vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { supabase } from '../supabase'
import {
  useCalendarEvents,
  snapTo15Minutes,
  neoEventChipStyle,
  isPendingCalendarMember
} from '../composables/useCalendarEvents'
import { useCalendarDragCreate, buildWeekPeriod, getWeekStart } from '../composables/useCalendarDragCreate'
import { DEFAULT_TAG_COLOR, TAG_COLOR_PALETTE } from '../constants/tagColorPalette'

/** Default week viewport: 8am–3pm. Full day remains scrollable — do not use dayBoundaries. */
const DEFAULT_WEEK_SCROLL_START_HOUR = 8
const DEFAULT_WEEK_SCROLL_END_HOUR = 15

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
  textInput: { openMenu: true, selectOnFocus: false },
  teleport: 'body',
  timeConfig: { enableTimePicker: false },
  ui: { menu: 'event-date-picker-menu' }
}

const timePickerBind = {
  autoApply: true,
  textInput: { openMenu: true, selectOnFocus: false },
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

function formatEventViewTime(ev) {
  if (!ev) return ''
  const start = new Date(ev.start_at)
  const end = new Date(ev.end_at)
  if (ev.all_day) {
    const fmt = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    return start.toDateString() === end.toDateString()
      ? fmt(start)
      : `${fmt(start)} – ${fmt(end)}`
  }
  const datePart = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timeFmt = { hour: 'numeric', minute: '2-digit' }
  return `${datePart}, ${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`
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

const colorPalette = TAG_COLOR_PALETTE

function needsEventRsvp(dbEvent, userId, tagList) {
  if (!dbEvent || !userId) return false
  if (dbEvent.created_by === userId) return false
  const tag = tagList.find((t) => t.id === dbEvent.tag_id)
  if (!tag?.is_shared && (dbEvent.response_count || 0) <= 1) return false
  return Boolean(dbEvent.my_response_status || (dbEvent.response_count || 0) > 1)
}

function showPendingRsvpActions(dbEvent, userId, tagList) {
  if (!needsEventRsvp(dbEvent, userId, tagList)) return false
  const status = dbEvent.my_response_status
  return status === 'pending' || status == null
}

export default {
  name: 'CalendarScreen',
  components: { Qalendar, VueDatePicker, CalendarScrollMonth, EventFlyoutContent },
  setup() {
    const route = useRoute()
    const userId = ref(null)
    const userEmail = ref('')
    const displayName = ref('')
    const loadError = ref('')
    const saving = ref(false)
    const activeTagId = ref(null)
    const showEventModal = ref(false)
    const eventViewOnly = ref(false)
    const showCreateCalendarModal = ref(false)
    const showEditCalendarModal = ref(false)
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
    const calendarHeaderTarget = ref(null)

    const syncCalendarHeaderTarget = async () => {
      await nextTick()
      calendarHeaderTarget.value =
        calendarWrapperRef.value?.querySelector('.calendar-header') || null
    }
    const qalendarRef = ref(null)
    const calendarPeriod = ref(buildWeekPeriod())
    const qalendarMode = ref('week')
    /** After save/delete: scroll back to event time or pre-save viewport */
    const pendingScrollAfterSave = ref(null)
    /** User scrolled week grid manually — skip auto 8am–3pm until calendar/view change */
    const weekScrollUserAdjusted = ref(false)
    const scrollRestoreTimeouts = []
    let weekScrollEl = null
    let weekScrollListener = null
    let programmaticScrollGuard = 0
    const editingEventId = ref(null)
    const newCalendarName = ref('')
    const newCalendarColor = ref(DEFAULT_TAG_COLOR)
    const editCalendarName = ref('')
    const editCalendarColor = ref(DEFAULT_TAG_COLOR)

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

    const eventDateValue = computed({
      get: () => eventForm.value.eventDate,
      set: (v) => { eventForm.value.eventDate = v ?? '' }
    })

    const eventStartDateValue = computed({
      get: () => eventForm.value.startDate,
      set: (v) => { eventForm.value.startDate = v ?? '' }
    })

    const eventEndDateValue = computed({
      get: () => eventForm.value.endDate,
      set: (v) => { eventForm.value.endDate = v ?? '' }
    })

    const {
      loading,
      tags,
      events,
      getTags,
      upsertUserProfile,
      searchUsers,
      createTag,
      updateTag,
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
      subscribeToEvents,
      respondToEvent
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

    const isInvitedCalendar = computed(() => Boolean(activeCalendar.value?.is_shared))

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
        !isPendingCalendarMember(m) &&
        (m.user_id === userId.value ||
          (m.user_email || '').toLowerCase() === email)
      )
      return memberRoleLabel(me?.role || (canManageCalendar.value ? 'owner' : 'member'))
    })

    const infoMemberCountLabel = computed(() => {
      const pending = infoCalendarMembers.value.filter(isPendingCalendarMember).length
      if (!pending) return String(infoCalendarMembers.value.length)
      return `${infoCalendarMembers.value.length} (${pending} pending)`
    })

    const shareAcceptedMembers = computed(() =>
      shareCalendarMembers.value.filter(m => m.role !== 'owner' && !isPendingCalendarMember(m))
    )

    const sharePendingMembers = computed(() =>
      shareCalendarMembers.value.filter(isPendingCalendarMember)
    )

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

    const isPersonalTag = (tag) => !tag?.is_shared
    const isSharedTag = (tag) => Boolean(tag?.is_shared)

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

    const calendarTagStyle = (tag) => ({
      '--cal-color': tag.color || 'var(--neo-accent)'
    })

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

    const qalendarEvents = computed(() =>
      toQalendarEvents(filteredEvents.value, { userId: userId.value })
    )

    const activeEditingEvent = computed(() =>
      events.value.find((e) => e.id === editingEventId.value) || null
    )

    const canEditActiveEvent = computed(() => {
      const ev = activeEditingEvent.value
      return ev ? canEditTag(ev.tag_id) : false
    })

    const monthFlyoutEventId = ref(null)

    const monthFlyoutDbEvent = computed(() =>
      monthFlyoutEventId.value
        ? events.value.find((e) => e.id === monthFlyoutEventId.value) || null
        : null
    )

    const monthFlyoutQEvent = computed(() =>
      monthFlyoutEventId.value
        ? qalendarEvents.value.find((e) => e.id === monthFlyoutEventId.value) || null
        : null
    )

    const dbEventById = (eventId) =>
      eventId ? events.value.find((e) => e.id === eventId) || null : null

    const showFlyoutRsvpActions = (eventId) => {
      const db = dbEventById(eventId)
      return showPendingRsvpActions(db, userId.value, tags.value)
    }

    const canOpenEventFlyoutEdit = (eventId) => {
      const db = dbEventById(eventId)
      if (!db) return false
      return Boolean(tags.value.find((t) => t.id === db.tag_id))
    }

    const canDeleteFlyoutEvent = (eventId) => {
      const db = dbEventById(eventId)
      return db ? canEditTag(db.tag_id) : false
    }

    const closeMonthFlyout = () => {
      monthFlyoutEventId.value = null
    }

    const onSelectMonthEvent = (payload) => {
      const eventId = resolveQalendarEventId(payload)
      if (!eventId) return
      monthFlyoutEventId.value = eventId
    }

    const qalendarConfig = computed(() => {
      const visibleTags = activeTagId.value
        ? tags.value.filter(t => t.id === activeTagId.value)
        : tags.value
      return {
        week: {
          startsOn: 'sunday',
          nDays: 7
        },
        defaultMode: 'week',
        locale: 'en-US',
        style: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          colorSchemes: buildColorSchemes(visibleTags)
        },
        isSilent: true,
        showCurrentTime: true,
        eventDialog: { isCustom: true }
      }
    })

    const weekEventBlockStyle = (eventData) => {
      const scheme = qalendarConfig.value.style?.colorSchemes?.[eventData?.colorScheme]
      const bg = scheme?.backgroundColor || eventData?.tagColor
      return neoEventChipStyle(bg)
    }

    const weekEventRsvpClass = (eventData) => {
      const status = eventData?.responseStatus
      if (status === 'pending') return 'is-rsvp-pending'
      if (status === 'rejected') return 'is-rsvp-rejected'
      return null
    }

    const allTagIds = computed(() => tags.value.map(t => t.id))

    const getWeekScrollEl = () =>
      calendarWrapperRef.value?.querySelector('.calendar-week__wrapper') ?? null

    const captureWeekScrollTop = () => {
      const el = getWeekScrollEl()
      return el ? el.scrollTop : null
    }

    /** Default viewport (8am–3pm). Not used after save/drag or once user scrolls. */
    const scrollWeekToDefaultViewport = () => {
      const el = getWeekScrollEl()
      if (!el) return false
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      if (maxScroll <= 0) return false
      const startRatio = DEFAULT_WEEK_SCROLL_START_HOUR / 24
      const endRatio = DEFAULT_WEEK_SCROLL_END_HOUR / 24
      const rangePx = (endRatio - startRatio) * el.scrollHeight
      let scrollTop
      if (el.clientHeight >= rangePx) {
        scrollTop = startRatio * el.scrollHeight - (el.clientHeight - rangePx) / 2
      } else {
        scrollTop = startRatio * el.scrollHeight - 10
      }
      return runProgrammaticWeekScroll(() => {
        el.scrollTop = Math.min(maxScroll, Math.max(0, scrollTop))
        return true
      })
    }

    const applyDefaultWeekViewportIfAllowed = () => {
      if (qalendarMode.value !== 'week') return
      if (weekScrollUserAdjusted.value) return
      if (pendingScrollAfterSave.value) return
      ensureWeekScrollTracking()
      scrollWeekToDefaultViewport()
    }

    const scheduleDefaultWeekViewport = () => {
      if (qalendarMode.value !== 'week') return
      weekScrollUserAdjusted.value = false
      const run = () => applyDefaultWeekViewportIfAllowed()
      run()
      nextTick(run)
      requestAnimationFrame(() => {
        run()
        setTimeout(run, 150)
        setTimeout(run, 400)
      })
    }

    const detachWeekScrollListener = () => {
      if (weekScrollEl && weekScrollListener) {
        weekScrollEl.removeEventListener('scroll', weekScrollListener, { passive: true })
      }
      weekScrollEl = null
      weekScrollListener = null
    }

    const ensureWeekScrollTracking = () => {
      const el = getWeekScrollEl()
      if (!el || el === weekScrollEl) return
      detachWeekScrollListener()
      weekScrollListener = () => {
        if (programmaticScrollGuard > 0) return
        weekScrollUserAdjusted.value = true
        if (pendingScrollAfterSave.value) clearScrollAfterSavePending()
      }
      weekScrollEl = el
      el.addEventListener('scroll', weekScrollListener, { passive: true })
    }

    const clearScrollAfterSavePending = () => {
      pendingScrollAfterSave.value = null
      for (const id of scrollRestoreTimeouts) clearTimeout(id)
      scrollRestoreTimeouts.length = 0
    }

    const runProgrammaticWeekScroll = (fn) => {
      programmaticScrollGuard++
      try {
        return fn()
      } finally {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            programmaticScrollGuard--
          })
        })
      }
    }

    /** Scroll week grid so event start time is in view (survives Qalendar remount). */
    const scrollWeekToDateTime = (startAt) => {
      if (!startAt) return false
      const el = getWeekScrollEl()
      if (!el) return false
      const d = new Date(startAt)
      if (Number.isNaN(d.getTime())) return false
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      if (maxScroll <= 0) return false
      const minutes = d.getHours() * 60 + d.getMinutes()
      const ratio = minutes / (24 * 60)
      return runProgrammaticWeekScroll(() => {
        el.scrollTop = Math.min(maxScroll, Math.max(0, ratio * el.scrollHeight - 56))
        return true
      })
    }

    const restoreWeekScrollTop = (scrollTop) => {
      if (scrollTop == null) return
      const el = getWeekScrollEl()
      if (!el) return
      runProgrammaticWeekScroll(() => {
        el.scrollTop = scrollTop
      })
    }

    const applyPendingScrollAfterSave = () => {
      const p = pendingScrollAfterSave.value
      if (!p) return
      ensureWeekScrollTracking()
      if (!p.allDay && p.startAt && scrollWeekToDateTime(p.startAt)) return
      if (p.fallbackTop != null) restoreWeekScrollTop(p.fallbackTop)
    }

    const scheduleScrollAfterSave = (startAt, allDay, fallbackTop) => {
      for (const id of scrollRestoreTimeouts) clearTimeout(id)
      scrollRestoreTimeouts.length = 0
      pendingScrollAfterSave.value = { startAt, allDay, fallbackTop }
      ensureWeekScrollTracking()
      const run = () => applyPendingScrollAfterSave()
      run()
      nextTick(run)
      requestAnimationFrame(() => {
        run()
        requestAnimationFrame(() => {
          for (const ms of [50, 150, 300, 500, 800, 1200, 1800]) {
            scrollRestoreTimeouts.push(setTimeout(run, ms))
          }
          scrollRestoreTimeouts.push(setTimeout(clearScrollAfterSavePending, 2000))
        })
      })
    }

    const preserveWeekScrollFor = async (fn, { startAt = null, allDay = false } = {}) => {
      const fallbackTop = captureWeekScrollTop()
      pendingScrollAfterSave.value = { startAt, allDay, fallbackTop }
      applyPendingScrollAfterSave()
      try {
        await fn()
      } finally {
        scheduleScrollAfterSave(startAt, allDay, fallbackTop)
      }
    }

    /** Refetch events. preserveScroll keeps week grid position after Qalendar re-renders. */
    const refreshEvents = async ({ preserveScroll = false, silent = false } = {}) => {
      const pending = pendingScrollAfterSave.value
      if (pending) {
        preserveScroll = false
      }
      const scrollTop = preserveScroll ? captureWeekScrollTop() : null
      if (allTagIds.value.length) {
        await getEvents(allTagIds.value, userId.value, userEmail.value, {
          silent: preserveScroll || silent
        })
      } else {
        events.value = []
      }
      if (pending) {
        applyPendingScrollAfterSave()
      } else if (preserveScroll && scrollTop != null) {
        restoreWeekScrollTop(scrollTop)
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
      const queryTag = route.query.tag
      if (queryTag && tags.value.some((t) => t.id === queryTag)) {
        activeTagId.value = queryTag
        eventForm.value.tagId = queryTag
      } else if (tags.value.length) {
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

    const weekPeriodKey = (period) => {
      const start = getWeekStart(period?.start ?? period?.selectedDate)
      if (!start) return ''
      return `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`
    }

    let lastWeekPeriodKey = weekPeriodKey(calendarPeriod.value)

    const onPeriodUpdated = (period) => {
      if (!period?.start) return
      const nextKey = weekPeriodKey(period)
      const weekChanged = lastWeekPeriodKey !== '' && nextKey !== lastWeekPeriodKey
      lastWeekPeriodKey = nextKey
      calendarPeriod.value = {
        start: period.start,
        end: period.end,
        selectedDate: period.selectedDate ?? period.start
      }
      if (weekChanged && qalendarMode.value === 'week') {
        scheduleDefaultWeekViewport()
      }
    }

    /** Qalendar header keeps its own currentPeriod copy — sync it when scroll month changes. */
    const syncQalendarHeaderPeriod = (period) => {
      const q = qalendarRef.value
      if (!q || !period?.start) return
      const fullPeriod = {
        start: period.start,
        end: period.end,
        selectedDate: period.selectedDate ?? period.start
      }
      q.period = fullPeriod
      const header = q.$refs?.appHeader
      if (header) {
        header.currentPeriod = fullPeriod
        const datePicker = header.$refs?.periodSelect
        if (datePicker) {
          datePicker.datePickerCurrentDate = fullPeriod.selectedDate
          datePicker.selectedDate = fullPeriod.selectedDate
          datePicker.setWeek?.(fullPeriod.selectedDate, true)
        }
      }
    }

    const onScrollMonthPeriodUpdated = (period) => {
      if (!period?.start) return
      calendarPeriod.value = {
        start: period.start,
        end: period.end,
        selectedDate: period.selectedDate ?? period.start
      }
      if (qalendarMode.value === 'month') {
        syncQalendarHeaderPeriod(calendarPeriod.value)
      }
    }

    const onQalendarModeUpdated = ({ mode }) => {
      if (mode) qalendarMode.value = mode
    }

    const calendarViewModes = [
      { id: 'day', label: 'Day' },
      { id: 'week', label: 'Week' },
      { id: 'month', label: 'Month' }
    ]

    const setCalendarViewMode = (mode) => {
      if (!mode || qalendarMode.value === mode) return
      qalendarRef.value?.handleChangeMode?.(mode)
    }

    const navigateCalendarPeriod = (direction) => {
      qalendarRef.value?.goToPeriod?.(direction)
    }

    watch(qalendarMode, async (mode) => {
      if (mode === 'month') {
        await nextTick()
        syncQalendarHeaderPeriod(calendarPeriod.value)
        await syncCalendarHeaderTarget()
        return
      }
      if (mode === 'week') {
        scheduleDefaultWeekViewport()
        await nextTick()
        ensureWeekScrollTracking()
      }
      await syncCalendarHeaderTarget()
    })

    watch(loading, async (isLoading) => {
      if (!isLoading) {
        await ensureDragCreate()
        await syncCalendarHeaderTarget()
      }
    })

    watch(
      qalendarEvents,
      () => {
        if (pendingScrollAfterSave.value) {
          applyPendingScrollAfterSave()
          return
        }
        if (qalendarMode.value !== 'week' || weekScrollUserAdjusted.value) return
        const el = getWeekScrollEl()
        if (el && el.scrollTop > 24) return
        applyDefaultWeekViewportIfAllowed()
      },
      { flush: 'post' }
    )

    let unsubscribe = null
    onMounted(async () => {
      await init()
      unsubscribe = subscribeToEvents(() => {
        if (pendingScrollAfterSave.value) {
          applyPendingScrollAfterSave()
          return
        }
        refreshEvents({ preserveScroll: true, silent: true })
      })
      await ensureDragCreate()
      await nextTick()
      scheduleDefaultWeekViewport()
      ensureWeekScrollTracking()
      await syncCalendarHeaderTarget()
    })

    onActivated(async () => {
      if (!userId.value || !userEmail.value) return
      await getTags(userId.value, userEmail.value)
      const queryTag = route.query.tag
      if (queryTag && tags.value.some((t) => t.id === queryTag)) {
        activeTagId.value = queryTag
        eventForm.value.tagId = queryTag
      }
      await refreshEvents({ preserveScroll: true, silent: true })
      await syncCalendarHeaderTarget()
    })
    onUnmounted(() => {
      if (unsubscribe) unsubscribe()
      detachDragCreate()
      clearScrollAfterSavePending()
      detachWeekScrollListener()
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
      newCalendarColor.value = DEFAULT_TAG_COLOR
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
        await refreshEvents({ preserveScroll: true, silent: true })
      } catch (err) {
        loadError.value = err.message || 'Failed to create calendar'
      } finally {
        saving.value = false
      }
    }

    const openEditCalendarModal = () => {
      const cal = activeCalendar.value
      if (!cal || !canManageCalendar.value) return
      editCalendarName.value = cal.name || ''
      editCalendarColor.value = cal.color || DEFAULT_TAG_COLOR
      showEditCalendarModal.value = true
    }

    const saveEditCalendar = async () => {
      const cal = activeCalendar.value
      if (!cal || !canManageCalendar.value) return
      const name = editCalendarName.value.trim()
      if (!name) return
      saving.value = true
      loadError.value = ''
      try {
        await updateTag(cal.id, {
          name,
          color: editCalendarColor.value
        })
        showEditCalendarModal.value = false
        await refreshEvents({ preserveScroll: true, silent: true })
      } catch (err) {
        loadError.value = err.message || 'Failed to update calendar'
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
      eventViewOnly.value = false
      resetEventForm(startHint, endHint, allDay)
      showEventModal.value = true
    }

    const onEditEvent = (payload) => {
      const eventId = resolveQalendarEventId(payload)
      const db = events.value.find(e => e.id === eventId)
      if (!db) return
      const tag = tags.value.find((t) => t.id === db.tag_id)
      const isMember = Boolean(tag)
      if (!isMember) {
        loadError.value = calendarEditDeniedMessage
        return
      }
      editingEventId.value = db.id
      eventViewOnly.value = !canEditTag(db.tag_id)
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
      eventViewOnly.value = false
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
        const { startAt, endAt } = eventTimesFromForm(eventForm.value)
        const allDay = eventForm.value.allDay
        await preserveWeekScrollFor(async () => {
          const tagId = eventForm.value.tagId
          const payload = {
            tagId,
            title: eventForm.value.title,
            description: eventForm.value.description,
            location: '',
            startAt,
            endAt,
            allDay
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
        }, { startAt, allDay })
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
        await preserveWeekScrollFor(async () => {
          await deleteEvent(target.id)
          const wasEditing = editingEventId.value === target.id
          cancelDeleteEvent()
          if (wasEditing) closeEventModal()
        }, { allDay: true })
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

    const flyoutOpenEdit = (eventId, closeFn) => {
      closeFn?.()
      closeMonthFlyout()
      onEditEvent(eventId)
    }

    const flyoutOpenDelete = (qEventOrId, closeFn) => {
      closeFn?.()
      closeMonthFlyout()
      onDeleteEvent(qEventOrId)
    }

    const handleFlyoutRsvp = async (eventId, status, closeFn) => {
      const ev = dbEventById(eventId)
      if (!ev?.id || !userId.value) return
      saving.value = true
      loadError.value = ''
      try {
        await respondToEvent(ev.id, userId.value, userEmail.value, status)
        closeFn?.()
        closeMonthFlyout()
      } catch (err) {
        loadError.value = err.message || 'Failed to update response'
      } finally {
        saving.value = false
      }
    }

    const onEventDragged = async (qEvent) => {
      const eventId = resolveQalendarEventId(qEvent)
      if (!eventId) return
      const db = events.value.find(e => e.id === eventId)
      const dragUpdates = fromQalendarDrag(qEvent)
      const scrollTarget = {
        startAt: dragUpdates.start_at,
        allDay: !!dragUpdates.all_day
      }
      if (db && !canEditTag(db.tag_id)) {
        loadError.value = calendarEditDeniedMessage
        await preserveWeekScrollFor(async () => {
          await refreshEvents({ preserveScroll: true, silent: true })
        }, scrollTarget)
        return
      }
      try {
        await preserveWeekScrollFor(async () => {
          await updateEvent(eventId, dragUpdates)
        }, scrollTarget)
      } catch (err) {
        loadError.value = err.message
        await preserveWeekScrollFor(async () => {
          await refreshEvents({ preserveScroll: true, silent: true })
        }, { startAt: db?.start_at, allDay: !!db?.all_day })
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
      scheduleDefaultWeekViewport()
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

    const memberStatusLabel = (member) => {
      if (member?.role === 'owner') return 'Owner'
      if (isPendingCalendarMember(member)) return 'Pending'
      return memberRoleLabel(member.role)
    }

    const memberStatusClass = (member) => {
      if (member?.role === 'owner') return 'owner'
      if (isPendingCalendarMember(member)) return 'pending'
      return memberRoleClass(member.role)
    }

    const shareUserBadgeLabel = (user) => {
      const email = (user.email || '').toLowerCase()
      if (!email) return null
      const member = shareCalendarMembers.value.find(
        (m) => m.role !== 'owner' && (m.user_email || '').toLowerCase() === email
      )
      if (!member) return null
      return isPendingCalendarMember(member) ? 'Pending' : 'Shared'
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

    const openEditFromInfo = () => {
      if (!canManageCalendar.value) return
      openEditCalendarModal()
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
      calendarHeaderTarget,
      qalendarRef,
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
      openEditFromInfo,
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
      memberStatusLabel,
      memberStatusClass,
      infoMemberCountLabel,
      shareAcceptedMembers,
      sharePendingMembers,
      shareUserBadgeLabel,
      memberInitial,
      isPendingCalendarMember,
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
      qalendarMode,
      calendarViewModes,
      setCalendarViewMode,
      navigateCalendarPeriod,
      qalendarEvents,
      qalendarConfig,
      calendarPeriod,
      onScrollMonthPeriodUpdated,
      onQalendarModeUpdated,
      formatWeekEventTime,
      showWeekEventTime,
      showWeekEventCreator,
      weekEventBlockStyle,
      weekEventRsvpClass,
      showEventModal,
      eventViewOnly,
      activeEditingEvent,
      canEditActiveEvent,
      monthFlyoutEventId,
      monthFlyoutQEvent,
      monthFlyoutDbEvent,
      dbEventById,
      showFlyoutRsvpActions,
      canOpenEventFlyoutEdit,
      canDeleteFlyoutEvent,
      closeMonthFlyout,
      onSelectMonthEvent,
      flyoutOpenEdit,
      flyoutOpenDelete,
      handleFlyoutRsvp,
      formatEventViewTime,
      showCreateCalendarModal,
      showEditCalendarModal,
      editCalendarName,
      editCalendarColor,
      openEditCalendarModal,
      saveEditCalendar,
      showDeleteCalendarModal,
      showDeleteEventModal,
      eventToDelete,
      cancelDeleteEvent,
      performDeleteEvent,
      editingEventId,
      eventForm,
      eventDateValue,
      eventStartDateValue,
      eventEndDateValue,
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
  background: var(--neo-bg);
}

.calendar-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 16px 20px;
  background: var(--neo-bg);
  border-bottom: none;
}

.calendar-topbar__head h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--neo-text);
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
  background: var(--neo-bg);
  border-right: none;
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
  color: var(--neo-text-muted);
}

.calendar-tag-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 8px;
  overflow-x: visible;
  overflow-y: auto;
  min-height: 0;
  background: var(--neo-bg-tray);
  border-radius: var(--neo-radius-lg);
  box-shadow: var(--neo-inset);
}

.calendar-tag-list .calendar-all-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  max-height: 32px;
  padding: 6px 12px;
  border-radius: var(--neo-radius-md);
  border: none;
  background: var(--neo-bg-light);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: normal;
  text-transform: none;
  text-align: left;
  color: var(--neo-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: var(--neo-raised-sm);
  transition: box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.calendar-tag-list .calendar-all-btn:hover {
  background: color-mix(in srgb, #ffffff 52%, var(--neo-bg));
}

.calendar-tag-list .calendar-all-btn.active {
  background: color-mix(in srgb, var(--neo-accent) 14%, var(--neo-bg-light));
  color: var(--neo-text);
  font-weight: 600;
  box-shadow: var(--neo-raised-sm);
}

.calendar-tag-list .folder-tag.calendar-tag {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  max-height: none;
  padding: 7px 12px 7px 14px;
  border-radius: var(--neo-radius-md);
  border: none;
  background: var(--neo-bg-light);
  color: var(--neo-text);
  text-align: left;
  text-transform: none;
  letter-spacing: normal;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  white-space: normal;
  box-shadow: var(--neo-raised-sm);
  transition: box-shadow 0.15s ease, background 0.15s ease;
  overflow: hidden;
}

.calendar-tag-list .folder-tag.calendar-tag::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--cal-color, var(--neo-accent));
  border-radius: 10px 0 0 10px;
}

.calendar-tag-list .folder-tag.calendar-tag:not(.tag-shared) {
  flex-direction: row;
  align-items: center;
  max-height: 36px;
  white-space: nowrap;
}

.calendar-tag-list .folder-tag.calendar-tag.tag-shared {
  min-height: 46px;
  padding: 6px 12px 7px 14px;
  box-shadow:
    var(--neo-raised-sm),
    inset 0 0 0 1px color-mix(in srgb, var(--cal-color, var(--neo-accent)) 35%, transparent);
}

.calendar-tag-list .folder-tag.calendar-tag:hover {
  background: color-mix(in srgb, var(--cal-color, var(--neo-accent)) 6%, var(--neo-bg-light));
}

.calendar-tag-list .folder-tag.active {
  background: color-mix(in srgb, var(--cal-color, var(--neo-accent)) 12%, var(--neo-bg-light));
  box-shadow: var(--neo-raised-sm);
  padding: 7px 12px 7px 14px;
}

.calendar-tag-list .folder-tag.calendar-tag.tag-shared.active {
  padding: 6px 12px 7px 14px;
}

.calendar-tag-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  width: 100%;
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
  color: var(--neo-text-muted);
  font-size: 13px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--neo-accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--neo-accent);
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
  background: var(--neo-bg);
  color: var(--neo-text);
  border: none;
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
  background: var(--neo-accent);
  color: #fff;
  border: 1px solid #1a1a1a;
}

.calendar-action-create:hover {
  background: var(--neo-accent);
  border-color: #333;
}

.calendar-action-delete {
  background: var(--neo-bg);
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
  background: var(--neo-bg);
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
  background: var(--neo-bg);
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
  border-bottom: none;
  flex-shrink: 0;
}

.calendar-info-modal-head h3 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--neo-text);
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
  color: var(--neo-text);
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
  border: none;
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
  background: linear-gradient(135deg, var(--neo-accent), #764ba2);
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
  color: var(--neo-text);
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

.calendar-info-member-role.role-pending {
  background: #fff7ed;
  color: #c2410c;
}

.calendar-info-member.is-pending-invite {
  opacity: 0.92;
}

.calendar-info-footer {
  display: flex;
  gap: 10px;
  padding: 14px 20px 20px;
  border-top: none;
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

.calendar-info-action-edit {
  background: var(--neo-bg);
  color: #059669;
  border-color: #10b981;
}

.calendar-info-action-edit:hover:not(:disabled) {
  background: #10b981;
  color: #fff;
}

.calendar-info-action-share {
  background: var(--neo-bg);
  color: #4f46e5;
  border-color: #4f46e5;
}

.calendar-info-action-share:hover:not(:disabled) {
  background: #4f46e5;
  color: #fff;
}

.calendar-info-action-remove {
  background: var(--neo-bg);
  color: #b45309;
  border-color: #f59e0b;
}

.calendar-info-action-remove:hover:not(:disabled) {
  background: #f59e0b;
  color: #fff;
}

.calendar-info-action-delete {
  background: var(--neo-bg);
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
  background: var(--neo-bg);
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

.calendar-tag-list .folder-tag.calendar-tag.tag-shared .tag-shared-icon {
  display: inline-flex;
  flex-shrink: 0;
  opacity: 0.9;
  color: var(--cal-color, var(--neo-accent));
}

.calendar-tag.tag-shared .calendar-kind-badge {
  color: color-mix(in srgb, var(--cal-color, var(--neo-accent)) 75%, #1a1a1a);
  background: color-mix(in srgb, var(--cal-color, var(--neo-accent)) 12%, var(--neo-bg));
  border: 1px solid color-mix(in srgb, var(--cal-color, var(--neo-accent)) 22%, #e9ecef);
}

.calendar-kind-badge {
  flex-shrink: 0;
  align-self: flex-start;
  margin: 0;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 1.2;
}

.calendar-tag.tag-dragging {
  opacity: 0.45;
}

.calendar-tag.tag-drag-over {
  box-shadow: 0 0 0 2px var(--cal-color, var(--neo-accent));
}

.share-modal-hint {
  font-size: 13px;
  color: var(--neo-text-muted);
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
  border: none;
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
  color: var(--neo-text);
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
  color: var(--neo-text-muted);
  padding: 12px 0;
}

.share-user-list {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
  border: none;
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
  background: var(--neo-bg);
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
  color: var(--neo-text);
}

.share-user-email {
  font-size: 12px;
  color: var(--neo-text-muted);
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

.share-user-badge.is-pending {
  color: #c2410c;
  background: #fff7ed;
}

.share-current {
  margin-bottom: 16px;
}

.share-current-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--neo-text-muted);
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

.share-chip.is-pending {
  background: #fff7ed;
  color: #c2410c;
  border: 1px dashed #fdba74;
}

.share-current-pending .share-current-label {
  color: #c2410c;
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
  color: var(--neo-text-muted);
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-actions-confirm {
  justify-content: space-between;
}

/* Event modal tag picker only — not sidebar calendar list */
.folder-tag:not(.calendar-tag):not(.calendar-all-btn) {
  display: inline-block;
  padding: 8px 14px;
  background: var(--neo-bg);
  border-radius: var(--neo-radius-pill);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  border: none;
  color: var(--neo-text-muted);
  cursor: pointer;
  transition: box-shadow 0.15s, color 0.15s;
  font-family: inherit;
  box-shadow: var(--neo-raised-sm);
}

.folder-tag:not(.calendar-tag):not(.calendar-all-btn):hover {
  color: var(--neo-text);
}

.folder-tag:not(.calendar-tag):not(.calendar-all-btn).active {
  color: var(--neo-text);
  box-shadow: var(--neo-inset-sm);
}

.calendar-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--neo-bg);
  border-radius: 12px;
  border: none;
  overflow: visible;
  padding: 8px;
  box-shadow: var(--neo-raised-sm);
}

.calendar-wrapper :deep(.calendar-root-wrapper) {
  overflow: hidden;
  border-radius: 10px;
}

.calendar-wrapper.is-scroll-month {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.calendar-wrapper.is-scroll-month :deep(.calendar-root-wrapper) {
  flex: 0 0 auto;
  height: auto;
  width: 100%;
}

.calendar-wrapper.is-scroll-month :deep(.calendar-month) {
  display: none !important;
}

.calendar-wrapper.is-scroll-month :deep(.calendar-root) {
  display: flex;
  flex-direction: column;
  height: auto !important;
  flex: 0 0 auto;
}

.calendar-wrapper.is-scroll-month :deep(.calendar-header) {
  flex-shrink: 0;
  background: var(--neo-bg);
}

/* Qalendar chrome — neomorphic theme */
.calendar-wrapper :deep(.calendar-root-wrapper .calendar-root) {
  background: var(--neo-bg) !important;
  border: none !important;
  box-shadow: var(--neo-inset-sm) !important;
  color: var(--neo-text);
}

.calendar-wrapper :deep(.calendar-root) {
  --qalendar-theme-color: var(--neo-accent);
  --qalendar-blue: var(--neo-accent);
  --qalendar-border-gray-thin: 1px solid rgba(163, 177, 198, 0.35);
  --qalendar-border-dashed-gray-thin: 1px dashed rgba(163, 177, 198, 0.35);
  --qalendar-light-gray: color-mix(in srgb, var(--neo-accent) 8%, var(--neo-bg));
  --qalendar-option-hover: color-mix(in srgb, var(--neo-accent) 14%, var(--neo-bg));
  --qalendar-gray-quite-dark: var(--neo-text-muted);
  --qalendar-gray: var(--neo-text-muted);
}

.calendar-wrapper :deep(.calendar-header) {
  background: var(--neo-bg) !important;
  box-shadow: inset 0 -1px 0 rgba(163, 177, 198, 0.2);
  display: grid !important;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 8px 12px;
  flex-wrap: nowrap !important;
  overflow: visible;
  position: relative;
  z-index: 20;
}

.calendar-wrapper :deep(.calendar-header__period-name) {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
  min-width: 0;
  margin-right: 0;
  font-size: 1rem;
  z-index: 2;
}

.calendar-wrapper :deep(.calendar-view-toolbar) {
  grid-column: 1 / -1;
  grid-row: 1;
  justify-self: center;
  z-index: 1;
}

.calendar-wrapper :deep(.calendar-header__period) {
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap !important;
  width: auto;
  min-height: 36px;
  gap: 6px;
  z-index: 2;
  overflow: visible;
  transform: translateX(-30px);
}

.calendar-wrapper :deep(.calendar-header__period .date-picker) {
  position: relative;
  transform: none;
  min-width: auto !important;
  width: fit-content;
  flex-shrink: 0;
  overflow: visible;
}

.calendar-wrapper :deep(.date-picker__value-display) {
  background: var(--neo-bg) !important;
  border: none !important;
  box-shadow: var(--neo-inset-sm) !important;
  border-radius: var(--neo-radius-pill) !important;
  color: var(--neo-text) !important;
  height: auto !important;
  min-height: 32px;
  padding: 6px 12px !important;
  font-size: 13px !important;
  font-family: inherit;
  font-weight: 500;
  gap: 6px;
}

.calendar-wrapper :deep(.calendar-header__chevron-arrows),
.calendar-wrapper :deep(.calendar-header__mode-picker) {
  display: none !important;
}

.calendar-wrapper :deep(.calendar-header__period .date-picker__value-display) {
  min-width: 0;
  max-width: none;
  white-space: nowrap;
  overflow: visible;
}

.calendar-wrapper :deep(.calendar-header__period .date-picker__value-display-text) {
  overflow: visible;
  text-overflow: clip;
  font-family: inherit;
}

.calendar-wrapper :deep(.date-picker__week-picker) {
  z-index: 200;
  font-family: inherit;
}

.calendar-wrapper :deep(.date-picker__week-picker .date-picker__week-picker-navigation),
.calendar-wrapper :deep(.date-picker__week-picker .date-picker__day-names),
.calendar-wrapper :deep(.date-picker__week-picker .week span) {
  font-family: inherit;
}

.calendar-view-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  flex-shrink: 0;
}

.calendar-view-modes {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 0 4px;
  border-radius: var(--neo-radius-pill);
  background: var(--neo-bg);
  box-shadow: var(--neo-inset-sm);
}

.calendar-view-mode {
  height: 28px;
  min-width: 48px;
  padding: 0 12px;
  border: none;
  border-radius: var(--neo-radius-pill);
  background: transparent;
  color: var(--neo-text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.calendar-view-mode:hover:not(.active) {
  color: var(--neo-text);
}

.calendar-view-mode.active {
  background: var(--neo-accent);
  color: #fff;
  box-shadow: var(--neo-raised-sm);
}

.calendar-view-nav {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--neo-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.calendar-view-nav:hover {
  color: var(--neo-text);
}

.calendar-wrapper :deep(.week-timeline__date),
.calendar-wrapper :deep(.is-today .week-timeline__date) {
  color: var(--neo-text-muted);
}

.calendar-wrapper :deep(.is-today .week-timeline__date) {
  background-color: var(--neo-accent) !important;
  color: #fff !important;
  box-shadow: var(--neo-raised-sm);
}

.calendar-wrapper :deep(.calendar-week .current-time-line) {
  background-color: var(--neo-accent) !important;
}

.calendar-wrapper :deep(.calendar-week .current-time-line__circle::before) {
  background-color: var(--neo-accent) !important;
}

.calendar-wrapper :deep(.day-timeline__hour-text) {
  color: var(--neo-text-muted);
}

/* Strip Qalendar’s solid fill so custom event chrome shows */
.calendar-wrapper :deep(.calendar-week__event) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.calendar-wrapper :deep(.calendar-week__event .calendar-week__event-info-wrapper) {
  padding: 1px !important;
  height: 100%;
}

.calendar-wrapper :deep(.vine-week-event) {
  --event-accent: var(--neo-accent);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 5px 8px 5px 10px;
  border-radius: var(--neo-radius-sm);
  overflow: hidden;
  box-sizing: border-box;
  line-height: 1.2;
  cursor: pointer;
  border: none;
  border-left: 3px solid var(--event-accent);
  background: color-mix(in srgb, var(--event-accent) 14%, var(--neo-bg));
  color: var(--neo-text);
  box-shadow: var(--neo-raised-sm);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.calendar-wrapper :deep(.vine-week-event:hover) {
  box-shadow: var(--neo-raised);
  transform: translateY(-1px);
}

.calendar-wrapper :deep(.vine-week-event.is-rsvp-pending) {
  background:
    repeating-linear-gradient(
      -45deg,
      color-mix(in srgb, var(--event-accent) 8%, var(--neo-bg)),
      color-mix(in srgb, var(--event-accent) 8%, var(--neo-bg)) 4px,
      color-mix(in srgb, var(--event-accent) 16%, var(--neo-bg)) 4px,
      color-mix(in srgb, var(--event-accent) 16%, var(--neo-bg)) 8px
    );
  border-left-style: solid;
  box-shadow: var(--neo-inset-sm);
}

.calendar-wrapper :deep(.vine-week-event.is-rsvp-rejected) {
  background: var(--neo-bg);
  border-left-color: var(--neo-text-muted);
  box-shadow: var(--neo-inset-sm);
  opacity: 0.75;
}

.calendar-wrapper :deep(.vine-week-event.is-rsvp-rejected .vine-week-event__title) {
  text-decoration: line-through;
  color: var(--neo-text-muted);
}

.calendar-wrapper :deep(.vine-week-event__title) {
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--event-accent) 50%, var(--neo-text));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-wrapper :deep(.vine-week-event__time),
.calendar-wrapper :deep(.vine-week-event__creator) {
  font-size: 10px;
  margin: 0;
  color: var(--neo-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-wrapper :deep(.vine-week-event.is-rsvp-pending .vine-week-event__time),
.calendar-wrapper :deep(.vine-week-event.is-rsvp-pending .vine-week-event__creator) {
  color: color-mix(in srgb, var(--event-accent) 40%, var(--neo-text-muted));
}

.drag-preview {
  position: absolute;
  background: color-mix(in srgb, var(--neo-accent) 18%, transparent);
  border: 2px dashed var(--neo-accent);
  border-radius: var(--neo-radius-sm);
  box-shadow: var(--neo-raised-sm);
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
  background: rgba(163, 177, 198, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
}

.modal {
  background: var(--neo-bg);
  padding: 32px;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--neo-raised-lg);
}

.modal-wide {
  max-width: 480px;
}

.modal h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--neo-text);
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neo-text);
  margin-bottom: 8px;
}

.optional {
  font-weight: 400;
  color: #adb5bd;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: var(--neo-bg);
}

.input:focus {
  outline: none;
  border-color: var(--neo-text);
  box-shadow: var(--neo-inset-sm), 0 0 0 2px rgba(232, 149, 111, 0.2);
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

.event-modal-overlay {
  background: rgba(163, 177, 198, 0.16) !important;
}

.event-modal-overlay .event-modal {
  background: var(--neo-bg);
  box-shadow: var(--neo-raised-lg);
}

.event-modal {
  max-width: 480px;
}

.month-event-flyout-overlay {
  align-items: flex-start;
  padding-top: 12vh;
}

.month-event-flyout-panel {
  width: calc(100% - 48px);
  max-width: 320px;
}

/* Qalendar wraps custom eventDialog in .event-flyout — ensure shell + inner layout */
.calendar-wrapper :deep(.event-flyout.is-visible) {
  min-width: 260px;
  max-width: min(320px, 98vw);
  background: var(--neo-bg) !important;
  border: none !important;
  border-radius: var(--neo-radius-lg) !important;
  box-shadow: var(--neo-raised-lg) !important;
  overflow: hidden;
}

.calendar-wrapper :deep(.event-flyout .vine-event-callout) {
  width: 100%;
}

.event-view-time {
  margin: 0;
  padding: 12px 16px;
  background: var(--neo-bg);
  border-radius: var(--neo-radius-md);
  font-size: 14px;
  color: var(--neo-text);
  box-shadow: var(--neo-inset-sm);
}

.time-section.is-readonly .event-date-picker {
  pointer-events: none;
  opacity: 0.85;
}

.event-tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-hint {
  font-size: 13px;
  color: var(--neo-text-muted);
  margin: 0;
}

.time-section .form-group {
  margin-bottom: 12px;
}

.event-date-picker {
  width: 100%;
  --dp-font-family: inherit;
  --dp-font-size: 14px;
  --dp-border-radius: 10px;
  --dp-cell-border-radius: 8px;
  --dp-primary-color: var(--neo-text);
  --dp-primary-text-color: #fff;
  --dp-hover-color: #f1f3f5;
  --dp-hover-text-color: var(--neo-text);
}

.event-date-picker :deep(.dp__input_wrap) {
  width: 100%;
}

.event-date-picker :deep(.dp__input) {
  padding: 12px 36px 12px 26px;
  border: none;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  font-family: inherit;
  min-height: 44px;
  width: 100%;
  background: var(--neo-bg);
  color: var(--neo-text);
  box-shadow: var(--neo-inset-sm);
  transition: box-shadow 0.2s;
}

.event-date-picker :deep(.dp__input_icon) {
  inset-inline-start: 0;
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
  border-color: var(--neo-text);
  box-shadow: var(--neo-inset-sm), 0 0 0 2px rgba(232, 149, 111, 0.2);
}

.event-date-picker :deep(.dp__menu) {
  border-radius: 12px;
  border: none;
  box-shadow: var(--neo-raised-lg);
}

.event-date-picker :deep(.dp__action_select) {
  background: var(--neo-accent);
}

.event-time-picker :deep(.dp__input) {
  min-height: 44px;
  padding: 12px 36px 12px 26px;
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
  color: var(--neo-text-muted);
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
  display: grid;
  grid-template-columns: repeat(8, 32px);
  gap: 8px;
  margin-top: 4px;
}

.color-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  padding: 0;
}

.color-circle:hover {
  transform: scale(1.12);
}

.color-circle.active {
  border-color: var(--neo-bg);
  box-shadow: var(--neo-raised-sm), 0 0 0 2px var(--neo-accent);
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
  color: var(--neo-text);
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
  background: var(--neo-bg);
  border-radius: 11px;
  position: relative;
  transition: background 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
  pointer-events: none;
  box-shadow: var(--neo-inset-sm);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: var(--neo-bg);
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: var(--neo-raised-sm);
}

.toggle-checkbox:checked + .toggle-switch {
  background: var(--neo-accent);
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
    border-bottom: none;
    max-height: 240px;
  }

  .calendar-tag-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .calendar-tag-list .folder-tag,
  .calendar-tag-list .calendar-all-btn {
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

<!-- Teleported picker menus (ui.menu class); scoped styles do not apply -->
<style>
.dp__menu.event-date-picker-menu {
  font-family: inherit;
  --dp-font-family: inherit;
  --dp-font-size: 14px;
}

.dp__menu.event-time-picker-menu {
  font-family: inherit;
  --dp-font-family: inherit;
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
