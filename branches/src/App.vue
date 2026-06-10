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
        <div class="nav-group">
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          View
        </router-link>
        <router-link to="/admin" class="nav-btn" :class="{ active: $route.name === 'admin' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
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
        </div>
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

    <!-- Mobile bottom navigation -->
    <nav class="mobile-bottom-nav" aria-label="Main navigation">
      <router-link to="/home" class="mobile-nav-btn" :class="{ active: $route.name === 'home' }">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </router-link>
      <router-link to="/lib" class="mobile-nav-btn" :class="{ active: $route.name === 'lib' }">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Library</span>
      </router-link>
      <router-link to="/admin" class="mobile-nav-btn" :class="{ active: $route.name === 'admin' }">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
        <span>Notes</span>
      </router-link>
      <router-link to="/calendar" class="mobile-nav-btn" :class="{ active: $route.name === 'calendar' }">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Calendar</span>
      </router-link>
      <button
        type="button"
        class="mobile-nav-btn"
        :class="{ active: isMoreRouteActive }"
        aria-label="More options"
        @click="moreMenuOpen = true"
      >
        <span class="mobile-nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
          <span v-if="unreadCount > 0" class="mobile-nav-badge"></span>
        </span>
        <span>More</span>
      </button>
    </nav>

    <!-- Mobile "More" menu -->
    <div
      v-if="moreMenuOpen"
      class="mobile-more-overlay"
      @click.self="moreMenuOpen = false"
    >
      <div class="mobile-more-sheet" role="dialog" aria-label="More navigation">
        <div class="mobile-more-header">
          <div class="mobile-more-user">
            <div class="user-avatar" :style="avatarStyle"></div>
            <div class="user-info">
              <div class="user-name">{{ displayName }}</div>
              <div class="user-role">{{ isAdmin ? 'Administrator' : 'Member' }}</div>
            </div>
          </div>
          <button type="button" class="mobile-more-close" aria-label="Close" @click="moreMenuOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <nav class="mobile-more-links">
          <router-link to="/read" class="mobile-more-link" @click="moreMenuOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            View
          </router-link>
          <router-link to="/saved" class="mobile-more-link" @click="moreMenuOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Saved
          </router-link>
          <router-link to="/notifications" class="mobile-more-link" @click="moreMenuOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Notifications
            <span v-if="unreadCount > 0" class="mobile-more-unread">{{ unreadCount }}</span>
          </router-link>
          <router-link to="/settings" class="mobile-more-link" @click="moreMenuOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </router-link>
        </nav>
        <button type="button" class="logout-btn mobile-more-logout" @click="handleLogout">Logout</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import LoginScreen from './components/LoginScreen.vue'
import { supabase } from './supabase'
import { useNotifications } from './composables/useNotifications'

export default {
  name: 'App',
  components: {
    LoginScreen
  },
  setup() {
    const route = useRoute()
    const user = ref(null)
    const loading = ref(true)
    const moreMenuOpen = ref(false)

    const moreRouteNames = new Set(['read', 'saved', 'notifications', 'settings'])
    const isMoreRouteActive = computed(() => moreRouteNames.has(route.name))

    watch(() => route.fullPath, () => {
      moreMenuOpen.value = false
    })

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
      moreMenuOpen,
      isMoreRouteActive,
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

:root {
  --mobile-nav-height: 64px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--neo-bg);
  color: var(--neo-text);
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--neo-bg);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(163, 177, 198, 0.35);
  border-top-color: var(--neo-accent);
  border-radius: 50%;
  background: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.app-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  background-color: var(--neo-bg);
}

/* Sidebar */
.sidebar {
  width: 240px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: var(--neo-bg);
  border-right: none;
  box-shadow: var(--neo-raised-sm);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  overflow-y: auto;
  z-index: 10;
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
  background-color: var(--neo-bg);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neo-accent);
  box-shadow: var(--neo-raised-sm);
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--neo-text);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--neo-bg);
  border-radius: var(--neo-radius-lg);
  box-shadow: var(--neo-inset);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  border-radius: var(--neo-radius-md);
  color: var(--neo-text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: box-shadow 0.2s, color 0.2s, background 0.2s;
  text-decoration: none;
  box-shadow: none;
}

.nav-btn:hover:not(.active) {
  color: var(--neo-text);
  background: rgba(163, 177, 198, 0.08);
}

.nav-btn.active {
  background: var(--neo-bg);
  color: var(--neo-accent);
  font-weight: 600;
  box-shadow: var(--neo-raised-sm);
}

.nav-group .notification-container {
  display: block;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: none;
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
  background: linear-gradient(135deg, var(--neo-accent) 0%, var(--neo-accent-bright) 100%);
  box-shadow: var(--neo-raised-sm);
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--neo-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.user-role {
  font-size: 12px;
  color: var(--neo-text-muted);
}

.logout-btn {
  padding: 8px 16px;
  background-color: var(--neo-bg);
  border: none;
  border-radius: var(--neo-radius-pill);
  color: var(--neo-text-muted);
  font-size: 12px;
  cursor: pointer;
  width: 100%;
  transition: box-shadow 0.2s, color 0.2s;
  box-shadow: var(--neo-raised-sm);
}

.logout-btn:hover {
  color: #c0392b;
  box-shadow: var(--neo-inset-sm);
}

/* Main Content */
.main-content {
  margin-left: 240px;
  height: 100vh;
  height: 100dvh;
  width: calc(100% - 240px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

/* Mobile bottom navigation */
.mobile-bottom-nav {
  display: none;
}

.mobile-more-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
    width: 100%;
    padding-bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px));
  }

  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background-color: var(--neo-bg);
    box-shadow: 0 -2px 12px rgba(163, 177, 198, 0.25);
    border-top: 1px solid rgba(163, 177, 198, 0.15);
  }

  .mobile-nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 4px;
    border: none;
    background: transparent;
    color: var(--neo-text-muted);
    font-size: 10px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    min-height: 44px;
    transition: color 0.2s;
  }

  .mobile-nav-btn.active {
    color: var(--neo-accent);
    font-weight: 600;
  }

  .mobile-nav-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-nav-badge {
    position: absolute;
    top: -2px;
    right: -4px;
    width: 8px;
    height: 8px;
    background-color: var(--neo-accent);
    border-radius: 50%;
    border: 2px solid var(--neo-bg);
  }

  .mobile-more-overlay {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.4);
    align-items: flex-end;
    justify-content: center;
  }

  .mobile-more-sheet {
    width: 100%;
    max-height: 85vh;
    background: var(--neo-bg);
    border-radius: 20px 20px 0 0;
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
    box-shadow: var(--neo-raised-lg);
    overflow-y: auto;
  }

  .mobile-more-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .mobile-more-user {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .mobile-more-user .user-name {
    max-width: none;
  }

  .mobile-more-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: var(--neo-bg);
    color: var(--neo-text-muted);
    cursor: pointer;
    box-shadow: var(--neo-raised-sm);
  }

  .mobile-more-links {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;
  }

  .mobile-more-link {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: var(--neo-radius-md);
    color: var(--neo-text);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.2s;
  }

  .mobile-more-link.router-link-active {
    background: rgba(232, 149, 111, 0.12);
    color: var(--neo-accent);
    font-weight: 600;
  }

  .mobile-more-unread {
    margin-left: auto;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--neo-accent);
    color: white;
    font-size: 11px;
    font-weight: 700;
    border-radius: 11px;
  }

  .mobile-more-logout {
    margin-top: 8px;
  }
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
  background-color: var(--neo-accent);
  border-radius: 50%;
  border: 2px solid var(--neo-bg);
  box-shadow: 0 0 6px rgba(232, 149, 111, 0.6);
}

.notification-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 360px;
  background-color: var(--neo-bg);
  border-radius: var(--neo-radius);
  box-shadow: var(--neo-raised-lg);
  border: none;
  z-index: 1000;
  margin-top: 8px;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: none;
  background-color: var(--neo-bg);
}

.notification-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--neo-text);
  margin: 0;
}

.mark-all-read-btn {
  background: var(--neo-bg);
  border: none;
  color: var(--neo-accent);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--neo-radius-pill);
  transition: box-shadow 0.2s;
  box-shadow: var(--neo-raised-sm);
}

.mark-all-read-btn:hover {
  box-shadow: var(--neo-inset-sm);
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
  border-bottom: none;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.notification-item:hover {
  box-shadow: var(--neo-inset-sm);
}

.notification-item.unread {
  box-shadow: var(--neo-inset-sm);
}

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neo-text-muted);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--neo-text);
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 11px;
  color: var(--neo-text-muted);
}

.notification-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--neo-text-muted);
  font-size: 13px;
}
</style>
