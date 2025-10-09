<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Centered Login Form -->
    <div class="w-full max-w-md mx-auto p-6">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-3 mb-6">
            <div
              class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <n-icon size="28" color="white">
                <Server />
              </n-icon>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">DataLookup Admin</h1>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p class="text-sm text-gray-600">
            Please sign in to your account
          </p>
        </div>

        <!-- Login Form -->
        <div class="p-4">
          <n-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large" @submit.prevent="handleLogin">
            <div class="space-y-6">
              <n-form-item path="email" :show-label="false">
                <n-input v-model:value="loginForm.email" placeholder="Email address" type="text" size="large"
                  :input-props="{ autocomplete: 'email', type: 'email' }">
                  <template #prefix>
                    <n-icon>
                      <Mail />
                    </n-icon>
                  </template>
                </n-input>
              </n-form-item>

              <n-form-item path="password" :show-label="false">
                <n-input v-model:value="loginForm.password" type="password" placeholder="Password" size="large"
                  show-password-on="click" :input-props="{ autocomplete: 'current-password' }">
                  <template #prefix>
                    <n-icon>
                      <LockClosed />
                    </n-icon>
                  </template>
                </n-input>
              </n-form-item>

              <div class="flex items-center justify-between">
                <n-checkbox v-model:checked="loginForm.rememberMe">
                  Remember me
                </n-checkbox>
              </div>

              <n-button type="primary" size="large" block :loading="authStore.isLoading" attr-type="submit">
                Sign in
              </n-button>
            </div>
          </n-form>

          <!-- Demo Accounts -->
          
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6">
        <p class="text-sm text-gray-500">
          © 2025 DataLookup Admin. All rights reserved.
        </p>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <n-modal v-model:show="showForgotPassword" preset="dialog" title="Reset Password">
      <div class="space-y-4">
        <p class="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <n-input v-model:value="forgotPasswordEmail" placeholder="Enter your email" type="text" size="large"
          :input-props="{ type: 'email' }">
          <template #prefix>
            <n-icon>
              <Mail />
            </n-icon>
          </template>
        </n-input>
      </div>
      <template #action>
        <div class="flex justify-end gap-3">
          <n-button @click="showForgotPassword = false">Cancel</n-button>
          <n-button type="primary" @click="handleForgotPassword">
            Send Reset Link
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  CheckmarkCircle,
  LockClosed,
  Mail,
  Person,
  Server,
  ShieldCheckmark
} from '@vicons/ionicons5'
import {
  NButton, NCheckbox,
  NForm, NFormItem,
  NIcon,
  NInput,
  NModal,
  useLoadingBar,
  useMessage
} from 'naive-ui'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const loadingBar = useLoadingBar()
const authStore = useAuthStore()

// State
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')
const loginFormRef = ref()

// Form data
const loginForm = ref({
  email: '',
  password: '',
  rememberMe: false
})

// Validation rules
const loginRules = {
  email: {
    required: true,
    message: 'Please input your email',
    trigger: ['input', 'blur']
  },
  password: {
    required: true,
    message: 'Please input your password',
    trigger: ['input', 'blur']
  }
}

// Methods
async function handleLogin() {
  try {
    await loginFormRef.value?.validate()

    loadingBar.start()

    const result = await authStore.login({
      email: loginForm.value.email,
      password: loginForm.value.password
    })

    if (result.success) {
      loadingBar.finish()
      message.success('Login successful!')
      await router.push('/')
    } else {
      loadingBar.error()
      message.error(result.error || 'Login failed')
    }
  } catch (error) {
    loadingBar.error()
    message.error('An unexpected error occurred')
  }
}

function handleForgotPassword() {
  if (!forgotPasswordEmail.value) {
    message.error('Please enter your email')
    return
  }

  // Simulate sending reset email
  setTimeout(() => {
    message.success('Password reset link sent to your email')
    showForgotPassword.value = false
    forgotPasswordEmail.value = ''
  }, 1000)
}
</script>

<style scoped>
/* Custom animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
