import { ref, computed } from 'vue'

// Shared reactive notifications state
const notifications = ref([
  { id: 1, type: 'document', title: 'New document published: "Weekly Devotional"', time: '2 minutes ago', read: false },
  { id: 2, type: 'announcement', title: 'Community announcement: Prayer meeting', time: '1 hour ago', read: false },
  { id: 3, type: 'calendar', title: 'Calendar invite: Sunday Service', time: '3 hours ago', read: true },
  { id: 4, type: 'document', title: 'New document: "Study on John 15"', time: 'Yesterday', read: false },
  { id: 5, type: 'announcement', title: 'System maintenance scheduled', time: '2 days ago', read: true }
])

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

const markAsRead = (notification) => {
  notification.read = true
}

const addNotification = (notification) => {
  notifications.value.unshift(notification)
}

export function useNotifications() {
  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    addNotification
  }
}