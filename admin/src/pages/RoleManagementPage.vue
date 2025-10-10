<template>
  <PageWrapper>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Role Management</h1>
          <p class="mt-2 text-sm text-gray-700">Manage user roles and permissions</p>
        </div>
        <n-button type="primary" size="large" @click="showCreateRoleModal = true">
          <template #icon>
            <n-icon>
              <Add />
            </n-icon>
          </template>
          Create Role
        </n-button>
      </div>

      <!-- Role Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <n-card>
          <n-statistic label="Total Roles" :value="roleStats.total">
            <template #prefix>
              <n-icon class="text-blue-500">
                <Shield />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card>
          <n-statistic label="Active Users" :value="roleStats.activeUsers">
            <template #prefix>
              <n-icon class="text-green-500">
                <People />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card>
          <n-statistic label="Custom Roles" :value="roleStats.customRoles">
            <template #prefix>
              <n-icon class="text-orange-500">
                <Settings />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </div>

      <!-- Roles Table -->
      <n-card title="Roles">
        <template #header-extra>
          <n-input v-model:value="searchQuery" placeholder="Search roles..." clearable style="width: 200px">
            <template #prefix>
              <n-icon>
                <Search />
              </n-icon>
            </template>
          </n-input>
        </template>

        <n-data-table :columns="roleColumns" :data="filteredRoles" :pagination="{ pageSize: 10 }" :loading="loading" />
      </n-card>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-blue-500 mb-4">
              <PersonAdd />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">User Role</h3>
            <p class="text-gray-600 text-sm mb-4">
              Basic user with limited permissions
            </p>
            <n-button type="primary" size="small" @click="createQuickRole('user')">
              Create User Role
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-green-500 mb-4">
              <Person />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Manager</h3>
            <p class="text-gray-600 text-sm mb-4">
              Team manager with moderate permissions
            </p>
            <n-button type="primary" size="small" @click="createQuickRole('manager')">
              Create Manager Role
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-purple-500 mb-4">
              <ShieldCheckmark />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Admin</h3>
            <p class="text-gray-600 text-sm mb-4">
              Administrator with full system access
            </p>
            <n-button type="primary" size="small" @click="createQuickRole('admin')">
              Create Admin Role
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-orange-500 mb-4">
              <Construct />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Custom</h3>
            <p class="text-gray-600 text-sm mb-4">
              Create custom role with specific permissions
            </p>
            <n-button type="primary" size="small" @click="showCreateRoleModal = true">
              Create Custom Role
            </n-button>
          </div>
        </n-card>
      </div>

      <!-- Create Role Modal -->
      <n-modal v-model:show="showCreateRoleModal" preset="dialog" title="Create New Role">
        <n-form ref="createRoleFormRef" :model="newRole" :rules="roleRules" label-placement="top">
          <n-form-item label="Role Name" path="name">
            <n-input v-model:value="newRole.name" placeholder="Enter role name" />
          </n-form-item>
          <n-form-item label="Description" path="description">
            <n-input v-model:value="newRole.description" type="textarea" placeholder="Enter role description"
              :autosize="{ minRows: 3, maxRows: 6 }" />
          </n-form-item>

          <n-form-item label="Permissions">
            <div class="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
              <div v-if="permissionsLoading" class="text-center text-gray-500">
                Loading permissions...
              </div>
              <div v-else-if="permissionsData?.data">
                <n-checkbox-group v-model:value="selectedPermissions">
                  <div class="grid grid-cols-1 gap-2">
                    <n-checkbox
                      v-for="permission in permissionsData.data"
                      :key="permission.id"
                      :value="permission.id"
                      :label="permission.name"
                    >
                      <div class="flex flex-col">
                        <span class="font-medium">{{ permission.name }}</span>
                        <span class="text-xs text-gray-500">{{ permission.description }}</span>
                      </div>
                    </n-checkbox>
                  </div>
                </n-checkbox-group>
              </div>
            </div>
          </n-form-item>

          <!-- <n-form-item label="Status" path="status">
            <n-switch v-model:value="newRole.active">
              <template #checked>Active</template>
              <template #unchecked>Inactive</template>
            </n-switch>
          </n-form-item> -->
        </n-form>
        <template #action>
          <div class="flex justify-end gap-3">
            <n-button @click="showCreateRoleModal = false">Cancel</n-button>
            <n-button type="primary" @click="handleCreateRole">Create Role</n-button>
          </div>
        </template>
      </n-modal>

      <!-- Edit Role Modal -->
      <n-modal v-model:show="showEditRoleModal" preset="dialog" title="Edit Role">
        <n-form ref="editRoleFormRef" :model="editRoleData" :rules="roleRules" label-placement="top">
          <n-form-item label="Role Name" path="name">
            <n-input v-model:value="editRoleData.name" placeholder="Enter role name" />
          </n-form-item>
          <n-form-item label="Description" path="description">
            <n-input v-model:value="editRoleData.description" type="textarea" placeholder="Enter role description"
              :autosize="{ minRows: 3, maxRows: 6 }" />
          </n-form-item>

          <n-form-item label="Permissions">
            <div class="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
              <div v-if="permissionsLoading" class="text-center text-gray-500">
                Loading permissions...
              </div>
              <div v-else-if="permissionsData?.data">
                <n-checkbox-group v-model:value="editSelectedPermissions">
                  <div class="grid grid-cols-1 gap-2">
                    <n-checkbox
                      v-for="permission in permissionsData.data"
                      :key="permission.id"
                      :value="permission.id"
                      :label="permission.name"
                    >
                      <div class="flex flex-col">
                        <span class="font-medium">{{ permission.name }}</span>
                        <span class="text-xs text-gray-500">{{ permission.description }}</span>
                      </div>
                    </n-checkbox>
                  </div>
                </n-checkbox-group>
              </div>
            </div>
          </n-form-item>

          <!-- <n-form-item label="Status" path="status">
            <n-switch v-model:value="editRoleData.active">
              <template #checked>Active</template>
              <template #unchecked>Inactive</template>
            </n-switch>
          </n-form-item> -->
        </n-form>
        <template #action>
          <div class="flex justify-end gap-3">
            <n-button @click="showEditRoleModal = false">Cancel</n-button>
            <n-button type="primary" @click="handleUpdateRole">Update Role</n-button>
          </div>
        </template>
      </n-modal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import {
  Add,
  Construct,
  Create,
  Eye,
  Key,
  People,
  Person,
  PersonAdd,
  Search,
  Settings,
  Shield,
  ShieldCheckmark,
  Trash
} from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NDataTable,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NStatistic,
  NSwitch,
  NTag,
  useDialog,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { computed, h, ref, onMounted } from 'vue'
import PageWrapper from '../components/common/PageWrapper.vue'
import { roleApi, type Role as ApiRole, type CreateRoleRequest } from '../services/roleApi'
import { permissionApi, type Permission as ApiPermission } from '../services/permissionApi'

import { useApi } from '../composables/useApi'

interface Role {
  id: number
  name: string
  description: string
  userCount: number
  active: boolean
  createdAt: string
}

interface NewRole {
  name: string
  description: string
  active: boolean
}

const message = useMessage()
const dialog = useDialog()

// API composables
const { data: rolesData, loading, error, execute: loadRoles } = useApi(roleApi.getRoles)
const { data: permissionsData, loading: permissionsLoading, execute: loadPermissions } = useApi(permissionApi.getPermissions)
const { loading: deleteLoading, execute: executeDelete } = useApi(roleApi.deleteRole)
const { loading: createLoading, execute: executeCreate } = useApi(roleApi.createRole)

// Reactive data
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showCreateRoleModal = ref(false)
const showEditRoleModal = ref(false)

// Permissions state
const selectedPermissions = ref<number[]>([])
const editSelectedPermissions = ref<number[]>([])

const selectedRole = ref<Role | null>(null)
const createRoleFormRef = ref()
const editRoleFormRef = ref()

const newRole = ref<NewRole>({
  name: '',
  description: '',
  active: true
})

const editRoleData = ref<NewRole>({
  name: '',
  description: '',
  active: true
})

// Transform API roles to local format
const roles = computed(() => {
  if (!rolesData.value?.data) return []

  return rolesData.value.data.map((role: ApiRole) => ({
    id: role.id,
    name: role.name,
    description: role.description || '',
    userCount: 0, // Would need additional API call to get user count
    active: true,
    createdAt: new Date(role.createdAt).toLocaleDateString()
  }))
})

// Load roles data
const loadRolesData = async () => {
  await loadRoles(currentPage.value, pageSize.value)
  if (error.value) {
    message.error(`Failed to load roles: ${error.value}`)
  }
}

// Load permissions data
// Initialize data on mount
onMounted(async () => {
  await loadRolesData()
  await loadPermissions()
})

interface Permission {
  id: number
  name: string
  category: string
}

// Role statistics (computed from real data)
const roleStats = computed(() => ({
  total: roles.value.length,
  activeUsers: roles.value.reduce((sum, role) => sum + role.userCount, 0),
  customRoles: roles.value.filter(role => {
    const roleDate = new Date(role.createdAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return roleDate > weekAgo
  }).length
}))

// Action functions
async function handleCreateRole() {
  if (!newRole.value.name || !newRole.value.description) {
    message.error('Please fill all required fields')
    return
  }

  try {
    // Create the role
    const createResult = await roleApi.createRole({
      name: newRole.value.name,
      description: newRole.value.description
    })

    if (createResult.success && createResult.data) {
      const newRoleId = createResult.data.id

      // Assign selected permissions
      if (selectedPermissions.value.length > 0) {
        for (const permissionId of selectedPermissions.value) {
          await roleApi.assignPermission(newRoleId, permissionId)
        }
      }

      message.success('Role created successfully with permissions')
      showCreateRoleModal.value = false

      // Reset form
      newRole.value = {
        name: '',
        description: '',
        active: true
      }
      selectedPermissions.value = []

      // Reload roles data
      await loadRolesData()
    } else {
      message.error(`Failed to create role: ${createResult.error}`)
    }
  } catch (error) {
    message.error(`Failed to create role: ${error}`)
  }
}

async function handleUpdateRole() {
  if (!selectedRole.value || !editRoleData.value.name || !editRoleData.value.description) {
    message.error('Please fill all required fields')
    return
  }

  try {
    // Update the role basic info
    const updateResult = await roleApi.updateRole(selectedRole.value.id, {
      name: editRoleData.value.name,
      description: editRoleData.value.description
    })

    if (updateResult.success) {
      message.success('Role updated successfully')
      showEditRoleModal.value = false

      // Reload roles data
      await loadRolesData()
    } else {
      message.error(`Failed to update role: ${updateResult.error}`)
    }
  } catch (error) {
    message.error(`Failed to update role: ${error}`)
  }
}

async function deleteRole(role: Role) {
  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        const result = await roleApi.deleteRole(role.id)

        if (result.success) {
          message.success('Role deleted successfully')
          // Reload roles data
          await loadRolesData()
        } else {
          message.error(`Failed to delete role: ${result.error}`)
        }
      } catch (error) {
        message.error(`Failed to delete role: ${error}`)
      }
    }
  })
}

function editRole(role: Role) {
  selectedRole.value = role
  editRoleData.value = {
    name: role.name,
    description: role.description,
    active: role.active
  }
  showEditRoleModal.value = true
}



// Form rules
const roleRules = {
  name: {
    required: true,
    message: 'Please input role name',
    trigger: ['input', 'blur']
  },
  description: {
    required: true,
    message: 'Please input role description',
    trigger: ['input', 'blur']
  }
}

// Computed
const filteredRoles = computed(() => {
  if (!searchQuery.value) return roles.value
  return roles.value.filter(role =>
    role.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Pagination
const paginationReactive = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  itemCount: rolesData.value?.total || 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    currentPage.value = page
    loadRolesData()
  },
  onUpdatePageSize: (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    loadRolesData()
  }
}))

// Table columns
const roleColumns: DataTableColumns<Role> = [
  {
    title: 'Role Name',
    key: 'name',
    render: (row) => h('div', [
      h('div', { class: 'font-medium' }, row.name),
      h('div', { class: 'text-sm text-gray-500' }, row.description)
    ])
  },
  {
    title: 'Users',
    key: 'userCount',
    render: (row) => h('span', { class: 'font-medium' }, row.userCount.toString())
  },

  {
    title: 'Status',
    key: 'active',
    render: (row) => h(NTag, {
      type: row.active ? 'success' : 'error'
    }, {
      default: () => row.active ? 'Active' : 'Inactive'
    })
  },
  {
    title: 'Created',
    key: 'createdAt'
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (row) => h('div', { class: 'flex gap-2' }, [
      h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => editRole(row)
      }, {
        default: () => 'Edit',
        icon: () => h(NIcon, null, { default: () => h(Create) })
      }),
      h(NButton, {
        size: 'small',
        type: 'error',
        onClick: () => deleteRole(row)
      }, {
        default: () => 'Delete',
        icon: () => h(NIcon, null, { default: () => h(Trash) })
      })
    ])
  }
]

// Methods
function hasPermission(roleId: number, permissionId: number): boolean {
  const role = roles.value.find(r => r.id === roleId)
  return role ? role.permissions.includes(permissionId) : false
}





function createQuickRole(type: string) {
  const roleTemplates: Record<string, Partial<Role>> = {
    user: {
      name: 'User',
      description: 'Basic user with standard permissions'
    },
    manager: {
      name: 'Manager',
      description: 'Team manager with moderate permissions'
    },
    admin: {
      name: 'Administrator',
      description: 'Administrator with full system access'
    }
  }

  const template = roleTemplates[type]
  if (template) {
    newRole.value = {
      name: template.name || '',
      description: template.description || '',
      active: true
    }
    showCreateRoleModal.value = true
  }
}

function createNewRole() {
  createRoleFormRef.value?.validate((errors?: unknown) => {
    if (!errors) {
      const role: Role = {
        id: Date.now(),
        ...newRole.value,
        userCount: 0,
        createdAt: new Date().toISOString().split('T')[0] || ''
      }

      roles.value.push(role)
      showCreateRoleModal.value = false

      // Reset form
      newRole.value = {
        name: '',
        description: '',
        active: true
      }

      message.success('Role created successfully')
    }
  })
}



</script>
