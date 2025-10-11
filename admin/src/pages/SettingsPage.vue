<template>
  <PageWrapper>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">System Settings</h1>
          <p class="mt-2 text-sm text-gray-700">Configure system-wide settings and quota limits</p>
        </div>
      </div>

      <!-- Settings Tabs -->
      <n-card>
        <n-tabs v-model:value="activeTab" type="line" animated>
          <!-- Quota Settings Tab -->
          <n-tab-pane name="quota" tab="Quota Settings">
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">Role-based Quota Limits</h2>
                  <p class="text-sm text-gray-600">Configure daily API lookup limits for each role</p>
                </div>
                <n-button type="primary" @click="showAddQuotaModal = true" :disabled="loading">
                  <template #icon>
                    <n-icon>
                      <Add />
                    </n-icon>
                  </template>
                  Add Quota Setting
                </n-button>
              </div>

              <!-- Quota Settings Table -->
              <n-data-table
                :columns="quotaColumns"
                :data="quotaSettings"
                :loading="loading"
                :pagination="false"
                size="large"
                striped
              />
            </div>
          </n-tab-pane>

          <!-- General Settings Tab -->
          <!-- <n-tab-pane name="general" tab="General Settings">
            <div class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-900">General System Settings</h2>

              <n-form :model="generalSettings" label-placement="left" label-width="200">
                <n-form-item label="Site Name">
                  <n-input
                    v-model:value="generalSettings.siteName"
                    placeholder="Enter site name"
                    @blur="updateGeneralSetting('site_name', generalSettings.siteName)"
                  />
                </n-form-item>

                <n-form-item label="Max Upload File Size (MB)">
                  <n-input-number
                    v-model:value="generalSettings.maxUploadSize"
                    placeholder="Enter max file size in MB"
                    :min="1"
                    :max="1000"
                    @blur="updateGeneralSetting('max_upload_size', generalSettings.maxUploadSize)"
                  />
                </n-form-item>

                <n-form-item label="Default User Role">
                  <n-select
                    v-model:value="generalSettings.defaultRole"
                    :options="roleOptions"
                    placeholder="Select default role for new users"
                    @update:value="updateGeneralSetting('default_user_role', generalSettings.defaultRole)"
                  />
                </n-form-item>

                <n-form-item label="Enable User Registration">
                  <n-switch
                    v-model:value="generalSettings.enableRegistration"
                    @update:value="updateGeneralSetting('enable_registration', generalSettings.enableRegistration)"
                  />
                </n-form-item>
              </n-form>
            </div>
          </n-tab-pane> -->
        </n-tabs>
      </n-card>

      <!-- Add/Edit Quota Setting Modal -->
      <n-modal
        v-model:show="showAddQuotaModal"
        :mask-closable="false"
        preset="dialog"
        title="Add Quota Setting"
        positive-text="Save"
        negative-text="Cancel"
        :positive-button-props="{ loading: savingQuota }"
        @positive-click="saveQuotaSetting"
        @negative-click="closeQuotaModal"
      >
        <div class="space-y-4 py-4">
          <n-form-item label="Role">
            <n-select
              v-model:value="quotaForm.roleName"
              :options="availableRoleOptions"
              placeholder="Select role"
            />
          </n-form-item>

          <n-form-item label="Daily Limit">
            <n-input-number
              v-model:value="quotaForm.dailyLimit"
              placeholder="Enter daily limit (-1 for unlimited)"
              :min="-1"
              :max="100000"
            />
            <template #suffix>
              <span class="text-xs text-gray-500">(-1 = unlimited)</span>
            </template>
          </n-form-item>

          <n-form-item label="Description">
            <n-input
              v-model:value="quotaForm.description"
              placeholder="Optional description"
              type="textarea"
              :rows="2"
            />
          </n-form-item>
        </div>
      </n-modal>

      <!-- Edit Quota Modal -->
      <n-modal
        v-model:show="showEditQuotaModal"
        :mask-closable="false"
        preset="dialog"
        title="Edit Quota Setting"
        positive-text="Update"
        negative-text="Cancel"
        :positive-button-props="{ loading: savingQuota }"
        @positive-click="updateQuotaSetting"
        @negative-click="closeEditQuotaModal"
      >
        <div class="space-y-4 py-4">
          <n-form-item label="Role">
            <n-input :value="editQuotaForm.roleName" readonly />
          </n-form-item>

          <n-form-item label="Daily Limit">
            <n-input-number
              v-model:value="editQuotaForm.dailyLimit"
              placeholder="Enter daily limit (-1 for unlimited)"
              :min="-1"
              :max="100000"
            />
            <template #suffix>
              <span class="text-xs text-gray-500">(-1 = unlimited)</span>
            </template>
          </n-form-item>

          <n-form-item label="Description">
            <n-input
              v-model:value="editQuotaForm.description"
              placeholder="Optional description"
              type="textarea"
              :rows="2"
            />
          </n-form-item>
        </div>
      </n-modal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useMessage } from 'naive-ui'
import { NButton, NTag, NPopconfirm, type DataTableColumns } from 'naive-ui'
import { Add, Create, TrashBin } from '@vicons/ionicons5'
import PageWrapper from '@/components/common/PageWrapper.vue'
import { apiCall } from '@/services/api'

const message = useMessage()

// Tab state
const activeTab = ref('quota')

// Loading states
const loading = ref(false)
const savingQuota = ref(false)

// Modal states
const showAddQuotaModal = ref(false)
const showEditQuotaModal = ref(false)

// Data
const quotaSettings = ref<QuotaSetting[]>([])
const roles = ref<Role[]>([])

// Form data
const quotaForm = ref({
  roleName: '',
  dailyLimit: 100,
  description: ''
})

const editQuotaForm = ref({
  key: '',
  roleName: '',
  dailyLimit: 100,
  description: ''
})

const generalSettings = ref({
  siteName: 'Data Lookup System',
  maxUploadSize: 10,
  defaultRole: '',
  enableRegistration: true
})

// Interfaces
interface QuotaSetting {
  key: string
  value: string
  type?: string
  description?: string
  category?: string
  createdAt: string
  updatedAt: string
}

interface Role {
  id: number
  name: string
  description: string
}

// Computed
const roleOptions = computed(() =>
  roles.value.map(role => ({
    label: role.name,
    value: role.name
  }))
)

const availableRoleOptions = computed(() => {
  const existingRoles = quotaSettings.value
    .filter(setting => setting.category === 'quota')
    .map(setting => setting.key.replace('_DAILY_LIMIT', '').toLowerCase())

  return roles.value
    .filter(role => !existingRoles.includes(role.name.toLowerCase()))
    .map(role => ({
      label: role.name,
      value: role.name
    }))
})

// Table columns
const quotaColumns: DataTableColumns<QuotaSetting> = [
  {
    title: 'Role',
    key: 'role',
    render: (row) => {
      const roleName = row.key.replace('_DAILY_LIMIT', '')
      return h('span', { class: 'font-medium capitalize' }, roleName.toLowerCase())
    }
  },
  {
    title: 'Daily Limit',
    key: 'limit',
    render: (row) => {
      const limit = parseInt(row.value)
      return h(NTag, {
        type: limit === -1 ? 'success' : 'info',
        size: 'small'
      }, {
        default: () => limit === -1 ? 'Unlimited' : `${limit.toLocaleString()} calls`
      })
    }
  },
  {
    title: 'Description',
    key: 'description',
    render: (row) => row.description || '-'
  },
  {
    title: 'Last Updated',
    key: 'updatedAt',
    render: (row) => new Date(row.updatedAt).toLocaleDateString()
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (row) => h('div', { class: 'flex gap-2' }, [
      h(NButton, {
        size: 'small',
        type: 'primary',
        secondary: true,
        onClick: () => editQuota(row)
      }, {
        default: () => h('span', { class: 'flex items-center gap-1' }, [
          h(Create, { class: 'w-4 h-4' }),
          'Edit'
        ])
      }),
      h(NPopconfirm, {
        onPositiveClick: () => deleteQuotaSetting(row.key)
      }, {
        trigger: () => h(NButton, {
          size: 'small',
          type: 'error',
          secondary: true
        }, {
          default: () => h('span', { class: 'flex items-center gap-1' }, [
            h(TrashBin, { class: 'w-4 h-4' }),
            'Delete'
          ])
        }),
        default: () => 'Are you sure you want to delete this quota setting?'
      })
    ])
  }
]

// API Functions
const loadQuotaSettings = async () => {
  loading.value = true
  try {
    const response = await apiCall({
      method: 'GET',
      url: '/settings'
    })

    if (response.success) {
      quotaSettings.value = response.data.filter((setting: QuotaSetting) =>
        setting.category === 'quota'
      )
    }
  } catch (error) {
    console.error('Failed to load quota settings:', error)
    message.error('Failed to load quota settings')
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    const response = await apiCall({
      method: 'GET',
      url: '/roles'
    })

    if (response.success) {
      roles.value = response.data.data || []
    }
  } catch (error) {
    console.error('Failed to load roles:', error)
  }
}

const loadGeneralSettings = async () => {
  try {
    const response = await apiCall({
      method: 'GET',
      url: '/settings'
    })

    if (response.success) {
      const settings = response.data
      // Map settings to form
      settings.forEach((setting: QuotaSetting) => {
        switch (setting.key) {
          case 'site_name':
            generalSettings.value.siteName = setting.value
            break
          case 'max_upload_size':
            generalSettings.value.maxUploadSize = parseInt(setting.value)
            break
          case 'default_user_role':
            generalSettings.value.defaultRole = setting.value
            break
          case 'enable_registration':
            generalSettings.value.enableRegistration = setting.value === 'true'
            break
        }
      })
    }
  } catch (error) {
    console.error('Failed to load general settings:', error)
  }
}

// Modal Functions
const closeQuotaModal = () => {
  showAddQuotaModal.value = false
  quotaForm.value = {
    roleName: '',
    dailyLimit: 100,
    description: ''
  }
}

const closeEditQuotaModal = () => {
  showEditQuotaModal.value = false
  editQuotaForm.value = {
    key: '',
    roleName: '',
    dailyLimit: 100,
    description: ''
  }
}

const editQuota = (setting: QuotaSetting) => {
  editQuotaForm.value = {
    key: setting.key,
    roleName: setting.key.replace('_DAILY_LIMIT', '').toLowerCase(),
    dailyLimit: parseInt(setting.value),
    description: setting.description || ''
  }
  showEditQuotaModal.value = true
}

// CRUD Functions
const saveQuotaSetting = async () => {
  if (!quotaForm.value.roleName) {
    message.error('Please select a role')
    return false
  }

  savingQuota.value = true
  try {
    const key = `${quotaForm.value.roleName.toUpperCase()}_DAILY_LIMIT`

    // Use PUT to upsert instead of POST to create
    const response = await apiCall({
      method: 'PUT',
      url: `/settings/${key}`,
      data: {
        value: quotaForm.value.dailyLimit.toString(),
        type: 'number',
        description: quotaForm.value.description,
        category: 'quota'
      }
    })

    if (response.success) {
      message.success('Quota setting saved successfully')
      await loadQuotaSettings()
      closeQuotaModal()
      return true
    } else {
      message.error(response.error || 'Failed to save quota setting')
      return false
    }
  } catch (error) {
    console.error('Failed to save quota setting:', error)
    message.error('Failed to save quota setting')
    return false
  } finally {
    savingQuota.value = false
  }
}

const updateQuotaSetting = async () => {
  savingQuota.value = true
  try {
    const response = await apiCall({
      method: 'PUT',
      url: `/settings/${editQuotaForm.value.key}`,
      data: {
        value: editQuotaForm.value.dailyLimit.toString(),
        type: 'number',
        description: editQuotaForm.value.description,
        category: 'quota'
      }
    })

    if (response.success) {
      message.success('Quota setting updated successfully')
      await loadQuotaSettings()
      closeEditQuotaModal()
      return true
    } else {
      message.error(response.error || 'Failed to update quota setting')
      return false
    }
  } catch (error) {
    console.error('Failed to update quota setting:', error)
    message.error('Failed to update quota setting')
    return false
  } finally {
    savingQuota.value = false
  }
}

const deleteQuotaSetting = async (key: string) => {
  try {
    const response = await apiCall({
      method: 'DELETE',
      url: `/settings/${key}`
    })

    if (response.success) {
      message.success('Quota setting deleted successfully')
      await loadQuotaSettings()
    } else {
      message.error(response.error || 'Failed to delete quota setting')
    }
  } catch (error) {
    console.error('Failed to delete quota setting:', error)
    message.error('Failed to delete quota setting')
  }
}

const updateGeneralSetting = async (key: string, value: string | number | boolean) => {
  try {
    // Determine the correct type for the setting
    let type = 'string'
    if (typeof value === 'number') {
      type = 'number'
    } else if (typeof value === 'boolean') {
      type = 'boolean'
    }

    const response = await apiCall({
      method: 'PUT',
      url: `/settings/${key}`,
      data: {
        value: typeof value === 'boolean' ? value.toString() : value.toString(),
        type,
        category: 'general'
      }
    })

    if (response.success) {
      message.success('Setting updated successfully')
    } else {
      message.error(response.error || 'Failed to update setting')
    }
  } catch (error) {
    console.error('Failed to update setting:', error)
    message.error('Failed to update setting')
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadQuotaSettings(),
    loadRoles(),
    loadGeneralSettings()
  ])
})
</script>

<style scoped>
.quota-management-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}
</style>
