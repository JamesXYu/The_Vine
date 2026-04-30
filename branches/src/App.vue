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
        <router-link to="/" class="nav-btn" :class="{ active: $route.name === 'home' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Library
        </router-link>
        <router-link to="/recent" class="nav-btn" :class="{ active: $route.name === 'recent' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Recent
        </router-link>
        <router-link to="/shared" class="nav-btn" :class="{ active: $route.name === 'shared' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Shared
        </router-link>
        <router-link to="/read" class="nav-btn" :class="{ active: $route.name === 'read' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Document Viewer
        </router-link>
        <router-link to="/admin" class="nav-btn" :class="{ active: $route.name === 'admin' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Admin Console
        </router-link>
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

    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
      loading.value = false

      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    })

    const handleLogin = (userData) => {
      user.value = userData
    }

    const handleLogout = async () => {
      await supabase.auth.signOut()
      user.value = null
    }

    return {
      user,
      loading,
      displayName,
      avatarUrl,
      avatarStyle,
      isAdmin,
      handleLogin,
      handleLogout
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
</style>
