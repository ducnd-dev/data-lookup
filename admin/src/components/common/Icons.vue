<script lang="ts">
import {
  CloudUpload,
  SpeedometerOutline as Dashboard,
  Person,
  Search,
  Shield,
  BusinessOutline as Work,
  SettingsOutline as Settings
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { defineComponent, h } from 'vue'

export const DashboardIcon = () => h(NIcon, null, { default: () => h(Dashboard) })
export const UserIcon = () => h(NIcon, null, { default: () => h(Person) })
export const FileSearchIcon = () => h(NIcon, null, { default: () => h(Search) })
export const UploadIcon = () => h(NIcon, null, { default: () => h(CloudUpload) })
export const BriefcaseIcon = () => h(NIcon, null, { default: () => h(Work) })
export const ShieldIcon = () => h(NIcon, null, { default: () => h(Shield) })
export const SettingsIcon = () => h(NIcon, null, { default: () => h(Settings) })

export default defineComponent({
  name: 'IconsComponent',
  render() {
    return h('div', 'Icon exports')
  }
})
</script>
