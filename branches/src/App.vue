<template>
  <LoginScreen v-if="!user && !loading" @login-success="handleLogin" />
  <div v-else-if="loading" class="loading-screen">
    <div class="spinner"></div>
  </div>
  <div v-else class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" fill="white"/>
            </svg>
          </div>
          <span class="logo-text">The Vine</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/home" class="nav-btn" :class="{ active: $route.name === 'home' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </router-link>
        <router-link to="/lib" class="nav-btn" :class="{ active: $route.name === 'lib' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Library
        </router-link>
        <router-link to="/saved" class="nav-btn" :class="{ active: $route.name === 'saved' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Saved
        </router-link>
        <router-link to="/calendar" class="nav-btn" :class="{ active: $route.name === 'calendar' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Calendar
        </router-link>
        <router-link to="/read" class="nav-btn" :class="{ active: $route.name === 'read' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          View
        </router-link>
        <router-link to="/admin" class="nav-btn" :class="{ active: $route.name === 'admin' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Notes
        </router-link>
        <!-- Notification Link -->
        <div class="notification-container">
          <router-link to="/notifications" class="nav-btn notification-btn" :class="{ active: $route.name === 'notifications' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Notifications
            <span v-if="unreadCount > 0" class="notification-badge"></span>
          </router-link>
        </div>
        <router-link to="/settings" class="nav-btn" :class="{ active: $route.name === 'settings' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar" :style="avatarStyle"></div>
          <div class="user-info">
            <div class="user-name">{{ displayName }}</div>
            <div class="user-role">{{ isAdmin ? 'Administrator' : 'Member' }}</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">Logout</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import LoginScreen from './components/LoginScreen.vue'
import { supabase } from './supabase'
import { useNotifications } from './composables/useNotifications'

export default {
  name: 'App',
  components: {
    LoginScreen
  },
  setup() {
    const user = ref(null)
    const loading = ref(true)

    const displayName = computed(() => {
      if (!user.value) return 'User'
      return user.value.user_metadata?.display_name || 
             user.value.email?.split('@')[0] || 
             'User'
    })

    const avatarUrl = computed(() => {
      return user.value?.user_metadata?.avatar_url || ''
    })

    const avatarStyle = computed(() => {
      if (avatarUrl.value) {
        return {
          backgroundImage: `url(${avatarUrl.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      }
      return {}
    })

    const isAdmin = computed(() => {
      if (!user.value) return false
      return user.value.user_metadata?.role === 'admin'
    })

    const { unreadCount, syncNotifications, clearNotificationsState } = useNotifications()

    const refreshNotifications = async (authUser) => {
      if (!authUser?.id) {
        clearNotificationsState()
        return
      }
      await syncNotifications(authUser.id, authUser.email)
    }

    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
      loading.value = false
      if (user.value) {
        await refreshNotifications(user.value)
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        user.value = session?.user ?? null
        if (user.value) {
          await refreshNotifications(user.value)
        } else {
          clearNotificationsState()
        }
      })
    })

    const handleLogin = async (userData) => {
      user.value = userData
      await refreshNotifications(userData)
    }

    const handleLogout = async () => {
      await supabase.auth.signOut()
      user.value = null
      clearNotificationsState()
    }

    return {
      user,
      loading,
      displayName,
      avatarUrl,
      avatarStyle,
      isAdmin,
      handleLogin,
      handleLogout,
      // Notification system
      unreadCount
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e9ecef;
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.app-layout {
  display: flex;
  height: 100vh;
  background-color: #f8f9fa;
}

/* Sidebar */
.sidebar {
  width: 240px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: #fff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  overflow-y: auto;
}

.sidebar-header {
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background-color: #1a1a1a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  border-radius: 10px;
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-btn:hover {
  background-color: #f8f9fa;
  color: #1a1a1a;
}

.nav-btn.active {
  background-color: #1a1a1a;
  color: white;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.user-role {
  font-size: 12px;
  color: #6c757d;
}

.logout-btn {
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  color: #6c757d;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #e74c3c;
  border-color: #e74c3c;
  color: white;
}

/* Main Content */
.main-content {
  margin-left: 240px;
  height: 100vh;
  width: calc(100% - 240px);
  overflow-y: auto;
}

/* Notification System */
.notification-container {
  position: relative;
}

.notification-btn {
  position: relative;
  width: 100%;
  text-align: left;
  justify-content: flex-start;
}

.notification-badge {
  position: absolute;
  top: 10px;
  right: 16px;
  width: 8px;
  height: 8px;
  background-color: #e74c3c;
  border-radius: 50%;
  border: 2px solid #fff;
}

.notification-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 360px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  z-index: 1000;
  margin-top: 8px;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.notification-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.mark-all-read-btn:hover {
  background-color: rgba(102, 126, 234, 0.1);
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
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
  width: 24px;
  height: 24px;
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
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 11px;
  color: #6c757d;
}

.notification-empty {
  padding: 32px 16px;
  text-align: center;
  color: #6c757d;
  font-size: 13px;
}
</style>
