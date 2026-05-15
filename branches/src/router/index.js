import { createRouter, createWebHistory } from 'vue-router'
import HomeScreen from '@/components/HomeScreen.vue'
import LibScreen from '@/components/LibScreen.vue'
import SavedScreen from '@/components/SavedScreen.vue'
import AdminScreen from '@/components/AdminScreen.vue'
import ReadScreen from '@/components/ReadScreen.vue'
import SettingsScreen from '@/components/SettingsScreen.vue'
import NotificationsScreen from '@/components/NotificationsScreen.vue'
import CalendarScreen from '@/components/CalendarScreen.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: HomeScreen
  },
  {
    path: '/lib',
    name: 'lib',
    component: LibScreen
  },
  {
    path: '/saved',
    name: 'saved',
    component: SavedScreen
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarScreen
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminScreen
  },
  {
    path: '/read',
    name: 'read',
    component: ReadScreen
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsScreen
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: NotificationsScreen
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
