import { createRouter, createWebHistory } from 'vue-router'
import HomeScreen from '@/components/HomeScreen.vue'
import RecentScreen from '@/components/RecentScreen.vue'
import SharedScreen from '@/components/SharedScreen.vue'
import AdminScreen from '@/components/AdminScreen.vue'
import ReadScreen from '@/components/ReadScreen.vue'
import SettingsScreen from '@/components/SettingsScreen.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeScreen
  },
  {
    path: '/recent',
    name: 'recent',
    component: RecentScreen
  },
  {
    path: '/shared',
    name: 'shared',
    component: SharedScreen
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
