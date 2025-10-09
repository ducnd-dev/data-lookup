<template>
  <n-config-provider :theme="theme">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <n-notification-provider>
            <n-layout class="h-screen" has-sider>
              <!-- Sidebar -->
              <n-layout-sider
                :width="250"
                :collapsed-width="0"
                :collapsed="collapsed"
                collapse-mode="width"
                :show-trigger="false"
                class="h-full"
              >
                <AppSidebar />
              </n-layout-sider>

              <!-- Main Content -->
              <n-layout class="flex flex-col">
                <!-- Header -->
                <n-layout-header class="flex-shrink-0 border-b border-gray-200 bg-white shadow-sm z-10">
                  <div class="flex items-center justify-between w-full">
                    <div class="flex items-center justify-between gap-4 w-full">
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
              </n-layout>
            </n-layout>
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
