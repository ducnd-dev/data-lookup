<template>
  <PageWrapper>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
          <p class="mt-2 text-sm text-gray-700">Manage user accounts and permissions</p>
        </div>
        <n-button type="primary" size="large" @click="showAddUserModal = true">
          <template #icon>
            <n-icon>
              <PersonAdd />
            </n-icon>
          </template>
          Add User
        </n-button>
      </div>

      <!-- Search and Filter -->
      <n-card>
        <div class="space-y-4">
          <!-- First row: Search and basic filters -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <n-input v-model:value="searchQuery" placeholder="Search users..." clearable @input="debouncedSearch">
              <template #prefix>
                <n-icon>
                  <Search />
                </n-icon>
              </template>
            </n-input>

            <n-select
              v-model:value="statusFilter"
              placeholder="Filter by status"
              :options="statusOptions"
              clearable
              @update:value="applyFilters"
            />

            <n-select
              v-model:value="roleFilter"
              placeholder="Filter by role"
              :options="roleFilterOptions"
              clearable
              @update:value="applyFilters"
            />

            <n-button type="primary" @click="showAdvancedFilters = !showAdvancedFilters">
              <template #icon>
                <n-icon>
                  <Search />
                </n-icon>
              </template>
              {{ showAdvancedFilters ? 'Hide' : 'Advanced' }} Filters
            </n-button>
          </div>

          <!-- Advanced filters -->
          <div v-if="showAdvancedFilters" class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <n-form-item label="Created Date Range">
                <n-date-picker
                  v-model:value="dateRange"
                  type="daterange"
                  placeholder="Select date range"
                  clearable
                  @update:value="applyFilters"
                />
              </n-form-item>
            </div>

            <div>
              <n-form-item label="Sort By">
                <n-select
                  v-model:value="sortBy"
                  :options="sortOptions"
                  placeholder="Sort by"
                  @update:value="applyFilters"
                />
              </n-form-item>
            </div>

            <div>
              <n-form-item label="Sort Order">
                <n-select
                  v-model:value="sortOrder"
                  :options="sortOrderOptions"
                  placeholder="Sort order"
                  @update:value="applyFilters"
                />
              </n-form-item>
            </div>

            <div class="md:col-span-3 flex gap-2">
              <n-button @click="clearFilters">Clear All Filters</n-button>
              <n-button type="info" @click="exportUsers">
                <template #icon>
                  <n-icon>
                    <Download />
                  </n-icon>
                </template>
                Export Users
              </n-button>
            </div>
          </div>

          <!-- Active filters display -->
          <div v-if="hasActiveFilters" class="flex flex-wrap gap-2">
            <span class="text-sm text-gray-600">Active filters:</span>
            <n-tag v-if="searchQuery" closable @close="searchQuery = ''; applyFilters()">
              Search: "{{ searchQuery }}"
            </n-tag>
            <n-tag v-if="statusFilter" closable @close="statusFilter = null; applyFilters()">
              Status: {{ statusFilter }}
            </n-tag>
            <n-tag v-if="roleFilter" closable @close="roleFilter = null; applyFilters()">
              Role: {{ roleFilterOptions.find((r: { value: number | undefined; label: string }) => r.value === roleFilter)?.label }}
            </n-tag>
            <n-tag v-if="dateRange && dateRange.length === 2" closable @close="dateRange = null; applyFilters()">
              Date: {{ formatDateRange(dateRange) }}
            </n-tag>
          </div>
        </div>
      </n-card>

      <!-- Users Table -->
      <n-card>
        <n-data-table :columns="columns" :data="filteredUsers" :pagination="paginationReactive" :loading="loading"
          striped />
      </n-card>

      <!-- Add User Modal -->
      <n-modal v-model:show="showAddUserModal">
        <n-card style="width: 600px" title="Add New User" :bordered="false" size="huge" role="dialog" aria-modal="true">
          <template #header-extra>
            <n-button quaternary circle @click="showAddUserModal = false">
              <template #icon>
                <n-icon>
                  <Close />
                </n-icon>
              </template>
            </n-button>
          </template>

          <n-form ref="formRef" :model="newUser" :rules="formRules" label-placement="top">
            <n-form-item label="Full Name" path="fullName">
              <n-input v-model:value="newUser.fullName" placeholder="Enter full name" />
            </n-form-item>

            <n-form-item label="Email" path="email">
              <n-input v-model:value="newUser.email" placeholder="Enter email address" />
            </n-form-item>

            <n-form-item label="Password" path="password">
              <n-input v-model:value="newUser.password" type="password" placeholder="Enter password" />
            </n-form-item>

            <n-form-item label="Role" path="roleIds">
              <n-select
                v-model:value="newUser.roleIds"
                :options="roleOptions"
                placeholder="Select role"
                multiple
                clearable
              />
            </n-form-item>
          </n-form>

          <template #footer>
            <div class="flex justify-end space-x-2">
              <n-button @click="showAddUserModal = false">Cancel</n-button>
              <n-button type="primary" :loading="createLoading" @click="handleAddUser">Add User</n-button>
            </div>
          </template>
        </n-card>
      </n-modal>

      <!-- Edit User Modal -->
      <n-modal v-model:show="showEditUserModal">
        <n-card style="width: 600px" title="Edit User" :bordered="false" size="huge" role="dialog" aria-modal="true">
          <template #header-extra>
            <n-button quaternary circle @click="showEditUserModal = false">
              <template #icon>
                <n-icon>
                  <Close />
                </n-icon>
              </template>
            </n-button>
          </template>

          <n-form ref="editFormRef" :model="editUserData" :rules="editFormRules" label-placement="top">
            <n-form-item label="Full Name" path="fullName">
              <n-input v-model:value="editUserData.fullName" placeholder="Enter full name" />
            </n-form-item>

            <n-form-item label="Email" path="email">
              <n-input v-model:value="editUserData.email" placeholder="Enter email address" />
            </n-form-item>

            <n-form-item label="Status">
              <n-switch v-model:value="editUserData.isActive">
                <template #checked>Active</template>
                <template #unchecked>Inactive</template>
              </n-switch>
            </n-form-item>

            <n-form-item label="Role">
              <n-select
                v-model:value="editUserData.roleIds"
                :options="roleOptions"
                placeholder="Select role"
                multiple
                clearable
              />
            </n-form-item>
          </n-form>

          <template #footer>
            <div class="flex justify-end space-x-2">
              <n-button @click="showEditUserModal = false">Cancel</n-button>
              <n-button type="primary" :loading="updateLoading" @click="handleEditUser">Update User</n-button>
            </div>
          </template>
        </n-card>
      </n-modal>

      <!-- View User Modal -->
      <n-modal v-model:show="showViewUserModal">
        <n-card style="width: 600px" title="User Details" :bordered="false" size="huge" role="dialog" aria-modal="true">
          <template #header-extra>
            <n-button quaternary circle @click="showViewUserModal = false">
              <template #icon>
                <n-icon>
                  <Close />
                </n-icon>
              </template>
            </n-button>
          </template>

          <div class="space-y-4" v-if="selectedUser">
            <div>
              <label class="text-sm font-medium text-gray-700">Full Name</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedUser.fullName }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Email</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedUser.email }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Roles</label>
              <div class="mt-1 flex gap-1 flex-wrap">
                <n-tag v-for="role in selectedUser.roles" :key="role.id"
                       :type="getRoleTagType(role.name)" size="small">
                  {{ role.name }}
                </n-tag>
                <n-tag v-if="!selectedUser.roles || selectedUser.roles.length === 0" type="default">
                  No Role
                </n-tag>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Status</label>
              <p class="mt-1">
                <n-tag :type="selectedUser.status === 'active' ? 'success' : 'error'">
                  {{ selectedUser.status === 'active' ? 'Active' : 'Inactive' }}
                </n-tag>
              </p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Created At</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedUser.createdAt }}</p>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end space-x-2">
              <n-button @click="showViewUserModal = false">Close</n-button>
              <n-button type="primary" @click="editUserFromView">Edit User</n-button>
            </div>
          </template>
        </n-card>
      </n-modal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import { Close, Create, Download, PersonAdd, Search, Trash } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDatePicker, NFormItem, NSelect, NTag, NSwitch, useMessage, useDialog } from 'naive-ui'
import { computed, h, ref, onMounted } from 'vue'
import PageWrapper from '../components/common/PageWrapper.vue'
import { userApi, type User as ApiUser, type UserFilters } from '../services/userApi'
import { roleApi, type Role } from '../services/roleApi'
import { useApi } from '../composables/useApi'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
  fullName?: string
  isActive?: boolean
  roles?: Array<{ id: number; name: string; description: string }>
}

interface NewUser {
  email: string
  fullName: string
  password: string
  roleIds?: number[]
}

const message = useMessage()
const dialog = useDialog()

// API composables
const { data: usersData, loading, error, execute: loadUsers } = useApi((page: number, limit: number, filters?: UserFilters) => userApi.getUsers(page, limit, filters))
const { execute: executeDelete } = useApi(userApi.deleteUser)
const { loading: createLoading, execute: executeCreate } = useApi(userApi.createUser)
const { loading: updateLoading, execute: executeUpdate } = useApi((id: number, data: EditUserData) => userApi.updateUser(id, data))
const { data: rolesData, execute: loadRoles } = useApi(roleApi.getRoles)

// Reactive data
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const roleFilter = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)
const showViewUserModal = ref(false)
const selectedUser = ref<User | null>(null)

// Advanced filter state
const showAdvancedFilters = ref(false)
const dateRange = ref<[number, number] | null>(null)
const sortBy = ref<string>('createdAt')
const sortOrder = ref<string>('desc')

const newUser = ref<NewUser>({
  email: '',
  fullName: '',
  password: '',
  roleIds: []
})

const editUserData = ref({
  id: 0,
  fullName: '',
  email: '',
  isActive: true,
  roleIds: [] as number[]
})

const editFormRules = {
  fullName: {
    required: true,
    message: 'Please input full name',
    trigger: ['input', 'blur']
  },
  email: {
    required: true,
    message: 'Please input email',
    trigger: ['input', 'blur']
  }
}

// Transform API users to local format
const users = computed(() => {
  if (!usersData.value?.data) return []

  return usersData.value.data.map((user: ApiUser) => ({
    id: user.id,
    firstName: user.fullName?.split(' ')[0] || '',
    lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
    email: user.email,
    // Fix role mapping với cấu trúc UserRole đúng
    role: user.roles?.[0]?.role?.name || 'No Role',
    status: (user.isActive ?? true) ? 'Active' : 'Inactive',
    createdAt: new Date(user.createdAt).toLocaleDateString(),
    fullName: user.fullName || '',
    isActive: user.isActive ?? true,
    // Fix roles mapping với cấu trúc UserRole đúng
    roles: user.roles?.map(userRole => ({
      id: userRole.role.id,
      name: userRole.role.name,
      description: userRole.role.description || ''
    })) || []
  }))
})

// Load users data with filters
const loadUsersData = async () => {
  const filters: UserFilters = {}

  if (searchQuery.value) filters.search = searchQuery.value
  if (statusFilter.value) filters.status = statusFilter.value as 'active' | 'inactive'
  if (roleFilter.value) filters.roleId = roleFilter.value
  if (dateRange.value && dateRange.value.length === 2) {
    filters.createdFrom = new Date(dateRange.value[0]).toISOString().split('T')[0]
    filters.createdTo = new Date(dateRange.value[1]).toISOString().split('T')[0]
  }
  if (sortBy.value) filters.sortBy = sortBy.value as 'fullName' | 'email' | 'createdAt'
  if (sortOrder.value) filters.sortOrder = sortOrder.value as 'asc' | 'desc'

  await loadUsers(currentPage.value, pageSize.value, filters)
  if (error.value) {
    message.error(`Failed to load users: ${error.value}`)
  }
}

// Initialize data on mount
onMounted(() => {
  loadUsersData()
  loadRoles()
})

// View user modal
// Edit user modal
// Local User type for computed users
interface LocalUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
  fullName: string
  isActive: boolean
  roles: { id: number; name: string; description: string }[]
}

// Update user data interface
interface EditUserData {
  id?: number
  fullName?: string
  email?: string
  isActive?: boolean
  roleIds?: number[]
}

const editingUser = ref<LocalUser | null>(null)

// Additional loading state for forms
const submitting = ref(false)


// Toggle user status function
const toggleUserStatus = async (user: User) => {
  try {
    const result = await userApi.toggleStatus(user.id)

    if (result.success) {
      message.success(`User ${user.fullName} has been ${user.status === 'Active' ? 'deactivated' : 'activated'}`)
      // Reload users data
      await loadUsersData()
    } else {
      message.error(`Failed to toggle user status: ${result.error}`)
    }
  } catch (error) {
    message.error(`Failed to toggle user status: ${error}`)
  }
}

// Edit user functions
const editUserAction = (user: LocalUser) => {
  editingUser.value = user

  // Debug log để xem cấu trúc dữ liệu
  console.log('Editing user:', user)
  console.log('User roles:', user.roles)

  editUserData.value = {
    id: user.id,
    fullName: user.fullName || '',
    email: user.email,
    isActive: user.isActive ?? true,
    // Fix mapping role IDs với cấu trúc UserRole đúng
    roleIds: user.roles?.map((role: { id: number; name: string; description: string }) => role.id) || []
  }
  showEditUserModal.value = true
}

const handleEditUser = async () => {
  if (!editingUser.value) return

  submitting.value = true
  try {
    const result = await executeUpdate(editingUser.value.id, editUserData.value)
    if (result.success) {
      message.success('User updated successfully')
      showEditUserModal.value = false
      await loadUsersData()
    } else {
      message.error(result.error || 'Failed to update user')
    }
  } catch (error) {
    console.error('Error updating user:', error)
    message.error('Failed to update user')
  } finally {
    submitting.value = false
  }
}

// Delete user function
const confirmDeleteUser = (user: LocalUser) => {
  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete user "${user.email}"? This action cannot be undone.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        const result = await executeDelete(user.id)
        if (result.success) {
          message.success('User deleted successfully')
          await loadUsersData()
        } else {
          message.error(result.error || 'Failed to delete user')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        message.error('Failed to delete user')
      }
    }
  })
}

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const roleOptions = computed(() => {
  if (!rolesData.value?.data) return []

  return rolesData.value.data.map((role: Role) => ({
    label: role.name,
    value: role.id
  }))
})

// Filter options
const roleFilterOptions = computed(() => {
  if (!rolesData.value?.data) return []

  return rolesData.value.data.map((role: Role) => ({
    label: role.name,
    value: role.id
  }))
})

const sortOptions = [
  { label: 'Full Name', value: 'fullName' },
  { label: 'Email', value: 'email' },
  { label: 'Created Date', value: 'createdAt' }
]

const sortOrderOptions = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' }
]

// Filter state
const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || statusFilter.value || roleFilter.value || dateRange.value)
})

const formRules = {
  fullName: {
    required: true,
    message: 'Please input full name',
    trigger: ['input', 'blur']
  },
  email: {
    required: true,
    message: 'Please input email',
    trigger: ['input', 'blur']
  },
  password: {
    required: true,
    message: 'Please input password',
    trigger: ['input', 'blur']
  }
}

const columns: DataTableColumns<User> = [
  {
    title: 'Name',
    key: 'name',
    render: (row: User) => `${row.firstName} ${row.lastName}`
  },
  {
    title: 'Email',
    key: 'email'
  },
  {
    title: 'Roles',
    key: 'role',
    render: (row: User) => {
      if (!row.roles || row.roles.length === 0) {
        return h(NTag, { type: 'default' }, { default: () => 'No Role' })
      }

      return h('div', { class: 'flex gap-1 flex-wrap' },
        row.roles.map(role =>
          h(NTag, {
            key: role.id,
            type: getRoleTagType(role.name) as 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error',
            size: 'small'
          }, { default: () => role.name })
        )
      )
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: User) => h('div', { class: 'flex items-center gap-2' }, [
      h(NTag, {
        type: row.status === 'Active' ? 'success' : 'error'
      }, {
        default: () => row.status
      }),
      h(NButton, {
        size: 'small',
        type: 'primary',
        secondary: true,
        onClick: () => toggleUserStatus(row)
      }, {
        default: () => row.status === 'Active' ? 'Deactivate' : 'Activate'
      })
    ])
  },
  {
    title: 'Created At',
    key: 'createdAt'
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (row: User) => h('div', { class: 'flex gap-2' }, [
      h(NButton, {
        size: 'small',
        onClick: () => editUserAction(row as LocalUser)
      }, {
        default: () => 'Edit',
        icon: () => h('n-icon', null, { default: () => h(Create) })
      }),
      h(NButton, {
        size: 'small',
        type: 'error',
        onClick: () => confirmDeleteUser(row as LocalUser)
      }, {
        default: () => 'Delete',
        icon: () => h('n-icon', null, { default: () => h(Trash) })
      })
    ])
  }
]

const paginationReactive = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  itemCount: usersData.value?.total || 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    currentPage.value = page
    loadUsersData()
  },
  onUpdatePageSize: (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    loadUsersData()
  }
}))

const filteredUsers = computed(() => {
  // Since we're now doing server-side filtering, just return the users from API
  return users.value
})

function getRoleTagType(role: string): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' {
  const types: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
    'Admin': 'error',
    'Manager': 'warning',
    'User': 'info'
  }
  return types[role] || 'default'
}

async function handleAddUser() {
  if (!newUser.value.email || !newUser.value.fullName || !newUser.value.password) {
    message.error('Please fill all required fields')
    return
  }

  const result = await executeCreate(newUser.value)

  if (result.success) {
    message.success('User added successfully')
    showAddUserModal.value = false

    // Reset form
    newUser.value = {
      email: '',
      fullName: '',
      password: '',
      roleIds: []
    }

    // Reload users data
    await loadUsersData()
  } else {
    message.error(`Failed to add user: ${result.error}`)
  }
}

// Filter functions
let searchTimeout: number

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

const applyFilters = () => {
  currentPage.value = 1 // Reset to first page when filtering
  loadUsersData()
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  roleFilter.value = null
  dateRange.value = null
  sortBy.value = 'createdAt'
  sortOrder.value = 'desc'
  applyFilters()
}

const exportUsers = async () => {
  try {
    const result = await userApi.exportUsers()
    if (result.success && result.data.downloadUrl) {
      // Create a link and trigger download
      const link = document.createElement('a')
      link.href = result.data.downloadUrl
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('Users exported successfully')
    } else {
      message.error('Failed to export users')
    }
  } catch (error) {
    console.error('Export error:', error)
    message.error('Failed to export users')
  }
}

const formatDateRange = (range: [number, number] | null) => {
  if (!range || range.length !== 2) return ''
  const start = new Date(range[0]).toLocaleDateString()
  const end = new Date(range[1]).toLocaleDateString()
  return `${start} - ${end}`
}

function editUserFromView() {
  if (selectedUser.value) {
    showViewUserModal.value = false
    editUserAction(selectedUser.value as LocalUser)
  }
}
</script>
