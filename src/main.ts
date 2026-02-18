import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/theme.css'
import './styles/tailwind.css'
import App from './App.vue'
import router from './router'

/* Font Awesome - Import only used icons for better performance */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { registerIcons } from '@/config/icons'

// Register only the icons used in the application (~75 instead of ~7000)
registerIcons()

const app = createApp(App)
const pinia = createPinia()

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(pinia)
app.use(router)
app.mount('#app')
