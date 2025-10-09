<template>
  <div class="flex items-center justify-between w-full px-4 py-3">
    <!-- Left side - Breadcrumb -->
    <div class="flex items-center w-full justify-between space-x-4 flex-1 min-w-0">
      <n-breadcrumb v-if="breadcrumbs.length > 0">
        <n-breadcrumb-item v-for="item in breadcrumbs" :key="item.name">
          {{ item.label }}
        </n-breadcrumb-item>
      </n-breadcrumb>
      <h1 v-else class="text-xl font-semibold text-gray-900 truncate">
        {{ getPageTitle() }}
      </h1>
    </div>

    <!-- Right side - Actions and User Menu -->
    <div class="flex justify-end items-center">
      <!-- User Menu -->
      <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect" trigger="click">
        <n-button text class="!px-3 !py-2 max-w-xs">
          <div class="flex items-center space-x-3">
            <n-avatar round size="small" class="ring-2 ring-blue-100 flex-shrink-0">
              <n-icon>
                <PersonOutline />
              </n-icon>
            </n-avatar>
            <div class="text-left hidden md:block min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ authStore.user?.fullName || 'User' }}</div>
              <div class="text-xs text-gray-500 truncate">Administrator</div>
            </div>
            <n-icon size="16" class="text-gray-400 flex-shrink-0">
              <ChevronDownOutline />
            </n-icon>
          </div>
        </n-button>
      </n-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownOutline, LogOutOutline, PersonOutline, SettingsOutline } from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    name: item.name,
    label: item.meta?.title || item.name
  }))
})

const getPageTitle = () => {
  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    DataLookup: 'Data Lookup',
    upload: 'Upload Data',
    jobs: 'Job Management',
    roles: 'Role Management'
  }
  return titleMap[route.name as string] || 'Data Lookup'
}

const userMenuOptions: DropdownOption[] = [
  {
    label: 'Profile Settings',
    key: 'profile',
    icon: () => h('n-icon', null, { default: () => h(SettingsOutline) })
  },
  {
    label: 'Account Settings',
    key: 'settings',
    icon: () => h('n-icon', null, { default: () => h(SettingsOutline) })
  },
  {
    type: 'divider'
  },
  {
    label: 'Sign Out',
    key: 'logout',
    icon: () => h('n-icon', null, { default: () => h(LogOutOutline) })
  }
]

const handleUserMenuSelect = async (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    message.success('Logged out successfully')
  } else if (key === 'settings' || key === 'profile') {
    message.info('Settings page coming soon...')
  }
}
</script>
