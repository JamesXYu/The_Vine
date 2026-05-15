<template>
  <div class="notifications-page">
    <div class="notifications-header">
      <h1>Notifications</h1>
      <button v-if="unreadCount > 0" class="mark-all-read-btn" @click="markAllAsRead">
        Mark all as read
      </button>
    </div>
    <div class="notifications-list">
      <div v-for="notification in notifications" 
           :key="notification.id"
           class="notification-item"
           :class="{ unread: !notification.read }"
           @click="handleNotificationClick(notification)">
        <div class="notification-icon">
          <svg v-if="notification.type === 'calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <svg v-else-if="notification.type === 'document'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <svg v-else-if="notification.type === 'announcement'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-time">{{ notification.time }}</div>
        </div>
      </div>
      <div v-if="notifications.length === 0" class="notification-empty">
        No notifications yet
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'

export default {
  name: 'NotificationsScreen',
  setup() {
    const router = useRouter()
    const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications()

    const handleNotificationClick = (notification) => {
      markAsRead(notification)
      // Navigation logic based on notification type
      switch (notification.type) {
        case 'document':
          router.push('/lib')
          break
        case 'announcement':
          router.push('/home')
          break
        case 'calendar':
          router.push('/calendar')
          break
      }
    }

    return {
      notifications,
      unreadCount,
      markAllAsRead,
      handleNotificationClick
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
  margin-bottom: 32px;
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

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f8f9fa;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
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
}
</style>