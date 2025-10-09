import naive from 'naive-ui'
import { createPinia } from 'pinia'
import 'vfonts/FiraCode.css'
import 'vfonts/Lato.css'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './styles/main.css'
import './utils/debugAuth'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(naive)

// Initialize authentication state
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
