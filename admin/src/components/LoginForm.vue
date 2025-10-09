<template>
  <div class="login-form p-6 max-w-md mx-auto">
    <h2 class="text-2xl font-bold mb-6">Login</h2>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          v-model="credentials.email"
          type="email"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="authStore.isLoading"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium mb-1">Password</label>
        <input
          id="password"
          v-model="credentials.password"
          type="password"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="authStore.isLoading"
        />
      </div>

      <div v-if="authStore.error" class="text-red-600 text-sm">
        {{ authStore.error }}
      </div>

      <button
        type="submit"
        :disabled="authStore.isLoading"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="authStore.isLoading">Logging in...</span>
        <span v-else>Login</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { LoginCredentials } from '@/services'
import { useAuthStore } from '@/stores/auth'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const credentials = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const handleLogin = async () => {
  authStore.clearError()

  const result = await authStore.login(credentials)

  if (result.success) {
    // Redirect to dashboard or home page
    router.push('/')
  }
}
</script>
