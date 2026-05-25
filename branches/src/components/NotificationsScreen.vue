<template>
  <div class="notifications-page">
    <div class="notifications-header">
      <h1>Notifications</h1>
      <button v-if="unreadCount > 0" class="mark-all-read-btn" @click="markAllAsRead">
        Mark all as read
      </button>
    </div>

    <div v-if="loading" class="notifications-loading">Loading notifications…</div>

    <template v-else>
      <section
        v-for="section in sections"
        :key="section.type"
        class="notification-section"
      >
        <div class="section-head">
          <h2>{{ section.label }}</h2>
          <span v-if="sectionItems(section.type).length" class="section-count">
            {{ sectionItems(section.type).length }}
          </span>
        </div>

        <div v-if="sectionItems(section.type).length" class="notifications-list">
          <div
            v-for="notification in sectionItems(section.type)"
            :key="notification.key"
            class="notification-item"
            :class="{
              unread: !notification.read,
              'requires-action': notification.subtype === 'invite'
            }"
            @click="openNotification(notification)"
          >
            <div class="notification-icon" :class="`icon-${notification.type}`">
              <svg v-if="notification.type === 'calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <svg v-else-if="notification.type === 'announcement'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-time">{{ notification.time }}</div>
              <p v-if="notification.subtype === 'invite'" class="notification-action-hint">
                Tap to accept or reject this calendar invite
              </p>
            </div>
          </div>
        </div>
        <p v-else class="section-empty">No {{ section.emptyLabel }} notifications</p>
      </section>

      <div
        v-if="!hasAnyNotifications"
        class="notification-empty"
      >
        You're all caught up — no new notifications
      </div>
    </template>

    <!-- Detail popup (no redirect on click) -->
    <div
      v-if="selectedNotification"
      class="modal-overlay"
      @click.self="closeNotificationDetail"
    >
      <div class="notification-detail-modal">
        <header class="detail-header">
          <span class="detail-badge" :class="`badge-${selectedNotification.type}`">
            {{ detailTypeLabel }}
          </span>
          <button type="button" class="detail-close" aria-label="Close" @click="closeNotificationDetail">
            ×
          </button>
        </header>

        <div class="detail-body">
          <h3>{{ selectedNotification.title }}</h3>
          <p class="detail-time">{{ selectedNotification.time }}</p>

          <!-- Notes / Announcement -->
          <template v-if="isDocumentNotification">
            <dl class="detail-meta">
              <div><dt>Author</dt><dd>{{ selectedNotification.payload.author }}</dd></div>
              <div v-if="selectedNotification.payload.folder">
                <dt>Folder</dt><dd>{{ selectedNotification.payload.folder }}</dd>
              </div>
            </dl>
            <p v-if="selectedNotification.payload.preview" class="detail-preview">
              {{ selectedNotification.payload.preview }}
            </p>
            <button type="button" class="btn-primary detail-action" @click="goToDocument">
              Open {{ selectedNotification.type === 'announcement' ? 'announcement' : 'note' }}
            </button>
          </template>

          <!-- Removed from shared calendar -->
          <template v-else-if="selectedNotification.subtype === 'member_removed'">
            <dl class="detail-meta">
              <div><dt>Calendar</dt><dd>{{ selectedNotification.payload.calendarName }}</dd></div>
              <div><dt>Removed by</dt><dd>{{ selectedNotification.payload.removedBy }}</dd></div>
            </dl>
            <p class="detail-hint">
              You no longer have access to this shared calendar or its events.
            </p>
          </template>

          <!-- Calendar event -->
          <template v-else-if="selectedNotification.subtype === 'event_created' || selectedNotification.subtype === 'event_updated' || selectedNotification.subtype === 'event_invite'">
            <dl class="detail-meta">
              <div><dt>Calendar</dt><dd>{{ selectedNotification.payload.calendarName }}</dd></div>
              <div><dt>When</dt><dd>{{ selectedNotification.payload.when }}</dd></div>
            </dl>
            <p v-if="selectedNotification.payload.description" class="detail-preview">
              {{ selectedNotification.payload.description }}
            </p>
            <button type="button" class="btn-primary detail-action" @click="goToCalendar">
              View in calendar
            </button>
          </template>

          <!-- Calendar invite -->
          <template v-else-if="selectedNotification.subtype === 'invite'">
            <dl class="detail-meta">
              <div><dt>Calendar</dt><dd>{{ selectedNotification.payload.calendarName }}</dd></div>
              <div><dt>Invited by</dt><dd>{{ selectedNotification.payload.inviterEmail }}</dd></div>
              <div><dt>Role</dt><dd>{{ inviteRoleLabel }}</dd></div>
            </dl>
            <p class="detail-hint">
              Accept to add this shared calendar to your sidebar, or reject to decline the invite.
            </p>
            <p v-if="inviteError" class="detail-error">{{ inviteError }}</p>
            <div class="detail-invite-actions">
              <button
                type="button"
                class="btn-secondary"
                :disabled="inviteBusy"
                @click="handleRejectInvite"
              >
                Reject
              </button>
              <button
                type="button"
                class="btn-primary"
                :disabled="inviteBusy"
                @click="handleAcceptInvite"
              >
                {{ inviteBusy ? 'Processing…' : 'Accept' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useNotifications } from '@/composables/useNotifications'
import { useCalendarEvents } from '@/composables/useCalendarEvents'

const SECTION_CONFIG = [
  { type: 'notes', label: 'Notes', emptyLabel: 'notes' },
  { type: 'announcement', label: 'Announcements', emptyLabel: 'announcement' },
  { type: 'calendar', label: 'Calendar', emptyLabel: 'calendar' }
]

export default {
  name: 'NotificationsScreen',
  setup() {
    const router = useRouter()
    const inviteBusy = ref(false)
    const inviteError = ref('')
    const { acceptMemberInvite, rejectMemberInvite } = useCalendarEvents()
    const {
      notificationsBySection,
      selectedNotification,
      loading,
      unreadCount,
      markAllAsRead,
      openNotification,
      closeNotificationDetail,
      acceptCalendarInvite,
      rejectCalendarInvite,
      syncNotifications
    } = useNotifications()

    onMounted(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await syncNotifications(user.id, user.email)
      }
    })

    const sections = SECTION_CONFIG

    const sectionItems = (type) => notificationsBySection.value[type] || []

    const hasAnyNotifications = computed(() =>
      sections.some((s) => sectionItems(s.type).length > 0)
    )

    const isDocumentNotification = computed(() => {
      const n = selectedNotification.value
      return n && (n.type === 'notes' || n.type === 'announcement')
    })

    const detailTypeLabel = computed(() => {
      const n = selectedNotification.value
      if (!n) return ''
      if (n.type === 'notes') return 'Note'
      if (n.type === 'announcement') return 'Announcement'
      if (n.subtype === 'invite') return 'Calendar invite'
      if (n.subtype === 'member_removed') return 'Calendar access'
      if (n.subtype === 'event_invite') return 'Calendar event'
      return 'Calendar event'
    })

    const inviteRoleLabel = computed(() => {
      const role = selectedNotification.value?.payload?.role
      if (role === 'editor') return 'Can edit events'
      if (role === 'viewer') return 'View only'
      return role || 'Member'
    })

    const goToDocument = () => {
      const docId = selectedNotification.value?.payload?.docId
      if (!docId) return
      closeNotificationDetail()
      router.push({ path: '/read', query: { doc: docId } })
    }

    const goToCalendar = () => {
      const tagId = selectedNotification.value?.payload?.tagId
      closeNotificationDetail()
      router.push({
        path: '/calendar',
        query: tagId ? { tag: tagId } : {}
      })
    }

    const refreshNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await syncNotifications(user.id, user.email)
      }
    }

    const handleAcceptInvite = async () => {
      inviteBusy.value = true
      inviteError.value = ''
      try {
        const tagId = await acceptCalendarInvite(selectedNotification.value, {
          acceptMemberInvite
        })
        if (!tagId) {
          inviteError.value = 'Could not accept invite. Re-run branches/supabase-schema.sql in Supabase SQL Editor if this keeps failing.'
          return
        }
        await refreshNotifications()
        closeNotificationDetail()
        router.push({
          path: '/calendar',
          query: typeof tagId === 'string' ? { tag: tagId } : {}
        })
      } finally {
        inviteBusy.value = false
      }
    }

    const handleRejectInvite = async () => {
      inviteBusy.value = true
      inviteError.value = ''
      try {
        const ok = await rejectCalendarInvite(selectedNotification.value, {
          rejectMemberInvite
        })
        if (!ok) {
          inviteError.value = 'Could not reject invite. Please try again.'
          return
        }
        await refreshNotifications()
        closeNotificationDetail()
      } finally {
        inviteBusy.value = false
      }
    }

    return {
      sections,
      loading,
      unreadCount,
      markAllAsRead,
      openNotification,
      closeNotificationDetail,
      selectedNotification,
      sectionItems,
      hasAnyNotifications,
      isDocumentNotification,
      detailTypeLabel,
      inviteRoleLabel,
      inviteBusy,
      inviteError,
      goToDocument,
      goToCalendar,
      handleAcceptInvite,
      handleRejectInvite
    }
  }
}
</script>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.notifications-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.mark-all-read-btn:hover {
  background-color: rgba(102, 126, 234, 0.1);
}

.notifications-loading {
  padding: 48px;
  text-align: center;
  color: #6c757d;
}

.notification-section {
  margin-bottom: 28px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-head h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.section-count {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.section-empty {
  font-size: 14px;
  color: #adb5bd;
  margin: 0;
  padding: 8px 0;
}

.notifications-list {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f4ff;
}

.notification-item.unread .notification-title {
  font-weight: 600;
}

.notification-item.requires-action {
  border-left: 3px solid #f59e0b;
}

.notification-item.requires-action.unread {
  background-color: #fffbeb;
}

.notification-action-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #b45309;
  line-height: 1.35;
}

.notification-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #6c757d;
}

.icon-notes {
  background: #eef2ff;
  color: #667eea;
}

.icon-announcement {
  background: #fff4e6;
  color: #f39c12;
}

.icon-calendar {
  background: #e8f8f0;
  color: #27ae60;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 13px;
  color: #6c757d;
}

.notification-empty {
  padding: 48px 20px;
  text-align: center;
  color: #6c757d;
  font-size: 15px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

/* Detail modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.notification-detail-modal {
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.detail-badge {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 6px;
}

.badge-notes {
  background: #eef2ff;
  color: #667eea;
}

.badge-announcement {
  background: #fff4e6;
  color: #e67e22;
}

.badge-calendar {
  background: #e8f8f0;
  color: #27ae60;
}

.detail-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: #6c757d;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.detail-close:hover {
  background: #f0f0f0;
  color: #1a1a1a;
}

.detail-body {
  padding: 20px;
}

.detail-body h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
  line-height: 1.35;
}

.detail-time {
  font-size: 13px;
  color: #6c757d;
  margin: 0 0 16px;
}

.detail-meta {
  margin: 0 0 16px;
}

.detail-meta div {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-meta dt {
  font-weight: 500;
  color: #6c757d;
  min-width: 72px;
  margin: 0;
}

.detail-meta dd {
  margin: 0;
  color: #1a1a1a;
}

.detail-preview {
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
  margin: 0 0 20px;
  white-space: pre-wrap;
}

.detail-hint {
  font-size: 13px;
  color: #6c757d;
  margin: 0 0 16px;
  line-height: 1.45;
}

.detail-error {
  font-size: 13px;
  color: #c0392b;
  margin: 0 0 12px;
  line-height: 1.45;
}

.detail-action {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: #1a1a1a;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.detail-action:hover {
  background: #333;
}

.detail-invite-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 10px 18px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn-primary {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #1a1a1a;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #333;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
