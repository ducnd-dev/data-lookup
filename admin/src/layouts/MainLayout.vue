<template>
  <n-config-provider :theme="theme">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <n-notification-provider>
            <div class="h-screen flex overflow-hidden bg-gray-50">
              <!-- Sidebar -->
              <div class="flex-shrink-0 transition-all duration-300 ease-in-out" :class="collapsed ? 'w-0' : 'w-64'">
                <n-layout-sider :width="250" :collapsed-width="0" :collapsed="collapsed" collapse-mode="width"
                  :show-trigger="false" class="h-full">
                  <AppSidebar />
                </n-layout-sider>
              </div>

              <!-- Main Content -->
              <div class="flex-1 flex flex-col overflow-hidden">
                <!-- Header -->
                <n-layout-header class="flex-shrink-0 border-b border-gray-200 bg-white shadow-sm z-10">
                  <div class="flex items-center justify-between w-full">
                    <div class="flex items-center justify-between space-x-4">
                      <n-button text size="large" @click="collapsed = !collapsed" class="lg:hidden ml-4">
                        <template #icon>
                          <n-icon>
                            <MenuOutline />
                          </n-icon>
                        </template>
                      </n-button>
                      <AppHeader />
                    </div>
                  </div>
                </n-layout-header>

                <!-- Content -->
                <n-layout-content class="flex-1 overflow-auto">
                  <router-view />
                </n-layout-content>
              </div>
            </div>
          </n-notification-provider>
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/Sidebar.vue'
import { MenuOutline } from '@vicons/ionicons5'
import { lightTheme } from 'naive-ui'
import { ref } from 'vue'

const theme = lightTheme
const collapsed = ref(false)
</script>
