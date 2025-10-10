<template>
  <div class="quota-management-page">
    <!-- Header -->
    <div class="page-header">
      <n-space justify="space-between" align="center">
        <div>
          <h1>Quota Manaconst message = useMessage()

// State
const loading = ref(false)
const loadingUsers = ref(false)
const searching = ref(false)
const searchEmail = ref('')
const roleSettings = ref<QuotaSetting[]>([])
const userQuotas = ref<UserQuota[]>([])

// HTTP helpers
const get = async (url: string, params?: Record<string, any>) => {
  const result = await apiCall({
    method: 'GET',
    url,
    params
  })
  if (!result.success) throw new Error(result.error)
  return result.data
}

const put = async (url: string, data?: any) => {
  const result = await apiCall({
    method: 'PUT',
    url,
    data
  })
  if (!result.success) throw new Error(result.error)
  return result.data
}>
          <p>Manage daily API quota limits for different user roles</p>
        </div>
        <n-button type="primary" @click="refreshData">
          <template #icon>
            <Icon icon="mdi:refresh" />
          </template>
          Refresh
        </n-button>
      </n-space>
    </div>

    <!-- Quota Settings Card -->
    <n-card title="Role-based Quota Limits" class="quota-card">
      <n-space vertical :size="24">
        <!-- Current Settings -->
        <div>
          <n-alert type="info" :bordered="false" style="margin-bottom: 16px">
            Configure daily API quota limits for each user role. Changes take effect immediately for new quotas.
          </n-alert>

          <n-spin :show="loading">
            <n-space vertical :size="16">
              <div v-for="role in roleSettings" :key="role.key" class="quota-setting-item">
                <n-space align="center" justify="space-between">
                  <div class="role-info">
                    <n-text strong>{{ formatRoleName(role.key) }}</n-text>
                    <br>
                    <n-text depth="3" size="small">{{ role.description }}</n-text>
                  </div>

                  <div class="quota-controls">
                    <n-space align="center">
                      <n-input-number
                        v-model:value="role.value"
                        :min="-1"
                        :max="10000"
                        :style="{ width: '120px' }"
                        placeholder="Limit"
                      />
                      <n-text depth="3">calls/day</n-text>
                      <n-button
                        type="primary"
                        size="small"
                        :loading="role.updating"
                        @click="updateQuotaSetting(role)"
                      >
                        Update
                      </n-button>
                    </n-space>
                  </div>
                </n-space>

                <n-divider v-if="role.key !== roleSettings[roleSettings.length - 1]?.key" />
              </div>
            </n-space>
          </n-spin>
        </div>

        <!-- Quota Info -->
        <n-alert type="warning" :bordered="false">
          <template #header>
            <Icon icon="mdi:information" style="margin-right: 8px" />
            Important Notes
          </template>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Set quota to <strong>-1</strong> for unlimited access</li>
            <li>Changes apply to new quota calculations, existing daily usage is preserved</li>
            <li>Users will see quota exceeded error when limit is reached</li>
            <li>Quotas reset daily at midnight (system timezone)</li>
          </ul>
        </n-alert>
      </n-space>
    </n-card>

    <!-- User Quota Overview -->
    <n-card title="User Quota Overview" class="overview-card">
      <n-space vertical :size="16">
        <div>
          <n-space align="center" style="margin-bottom: 16px">
            <n-input
              v-model:value="searchEmail"
              placeholder="Search by email..."
              clearable
              :style="{ width: '300px' }"
            >
              <template #prefix>
                <Icon icon="mdi:magnify" />
              </template>
            </n-input>
            <n-button @click="searchUserQuota" :loading="searching">
              Search
            </n-button>
          </n-space>
        </div>

        <n-spin :show="loadingUsers">
          <n-table v-if="userQuotas.length > 0" :bordered="false" :single-line="false">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Daily Limit</th>
                <th>Used Today</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="userQuota in userQuotas" :key="userQuota.userId">
                <td>
                  <div>
                    <n-text strong>{{ userQuota.user.fullName }}</n-text>
                    <br>
                    <n-text depth="3" size="small">{{ userQuota.user.email }}</n-text>
                  </div>
                </td>
                <td>
                  <n-tag
                    v-for="role in userQuota.user.roles"
                    :key="role.id"
                    :type="getRoleTagType(role.name)"
                    size="small"
                    style="margin-right: 4px"
                  >
                    {{ role.name }}
                  </n-tag>
                </td>
                <td>
                  <n-text>
                    {{ userQuota.dailyLimit === -1 ? 'Unlimited' : userQuota.dailyLimit }}
                  </n-text>
                </td>
                <td>
                  <n-text>{{ userQuota.dailyUsed }}</n-text>
                </td>
                <td>
                  <n-text>
                    {{ userQuota.dailyLimit === -1 ? 'Unlimited' : (userQuota.dailyLimit - userQuota.dailyUsed) }}
                  </n-text>
                </td>
                <td>
                  <n-tag
                    :type="getQuotaStatusType(userQuota)"
                    size="small"
                  >
                    {{ getQuotaStatusText(userQuota) }}
                  </n-tag>
                </td>
              </tr>
            </tbody>
          </n-table>

          <n-empty v-else description="No quota data found" />
        </n-spin>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard, NSpace, NButton, NAlert, NSpin, NText, NDivider,
  NInputNumber, NTable, NTag, NEmpty, NInput, useMessage
} from 'naive-ui'
import { apiCall } from '../services/api'

interface QuotaSetting {
  key: string
  value: number
  description: string
  updating?: boolean
}

interface UserQuota {
  userId: number
  dailyLimit: number
  dailyUsed: number
  user: {
    fullName: string
    email: string
    roles: Array<{ id: number; name: string }>
  }
}

const message = useMessage()
const { get, put } = useApi()

// State
const loading = ref(false)
const loadingUsers = ref(false)
const searching = ref(false)
const searchEmail = ref('')
const roleSettings = ref<QuotaSetting[]>([])
const userQuotas = ref<UserQuota[]>([])

// Methods
const formatRoleName = (key: string) => {
  return key.replace('_DAILY_LIMIT', '').replace('_', ' ')
}

const getRoleTagType = (roleName: string) => {
  const types: Record<string, string> = {
    'Admin': 'error',
    'Manager': 'warning',
    'User': 'info'
  }
  return types[roleName] || 'default'
}

const getQuotaStatusType = (quota: UserQuota) => {
  if (quota.dailyLimit === -1) return 'success'
  const usagePercent = (quota.dailyUsed / quota.dailyLimit) * 100
  if (usagePercent >= 100) return 'error'
  if (usagePercent >= 80) return 'warning'
  return 'success'
}

const getQuotaStatusText = (quota: UserQuota) => {
  if (quota.dailyLimit === -1) return 'Unlimited'
  const usagePercent = (quota.dailyUsed / quota.dailyLimit) * 100
  if (usagePercent >= 100) return 'Exceeded'
  if (usagePercent >= 80) return 'Near Limit'
  return 'Available'
}

const loadQuotaSettings = async () => {
  try {
    loading.value = true
    const response = await get('/api/settings/category/quota')

    roleSettings.value = response.map((setting: any) => ({
      key: setting.key,
      value: parseInt(setting.value),
      description: setting.description,
      updating: false
    }))
  } catch (error) {
    message.error('Failed to load quota settings')
    console.error('Error loading quota settings:', error)
  } finally {
    loading.value = false
  }
}

const updateQuotaSetting = async (setting: QuotaSetting) => {
  try {
    setting.updating = true
    await put('/api/settings/quota', {
      key: setting.key,
      value: setting.value
    })
    message.success(`${formatRoleName(setting.key)} quota updated successfully`)
  } catch (error) {
    message.error('Failed to update quota setting')
    console.error('Error updating quota:', error)
  } finally {
    setting.updating = false
  }
}

const loadUserQuotas = async () => {
  try {
    loadingUsers.value = true
    const response = await get('/api/quota/admin/all')
    userQuotas.value = response.data || []
  } catch (error) {
    message.error('Failed to load user quotas')
    console.error('Error loading user quotas:', error)
  } finally {
    loadingUsers.value = false
  }
}

const searchUserQuota = async () => {
  if (!searchEmail.value.trim()) {
    await loadUserQuotas()
    return
  }

  try {
    searching.value = true
    const response = await get('/api/quota/admin/all', {
      email: searchEmail.value
    })
    userQuotas.value = response.data || []
  } catch (error) {
    message.error('Failed to search user quotas')
    console.error('Error searching user quotas:', error)
  } finally {
    searching.value = false
  }
}

const refreshData = async () => {
  await Promise.all([
    loadQuotaSettings(),
    loadUserQuotas()
  ])
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.quota-management-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: var(--text-color-3);
}

.quota-card {
  margin-bottom: 24px;
}

.quota-setting-item {
  padding: 16px 0;
}

.role-info {
  flex: 1;
}

.quota-controls {
  flex-shrink: 0;
}

.overview-card {
  margin-bottom: 24px;
}
</style>
