import Layout from './Layout.vue'
import './style.css'
import { Icon } from '@iconify/vue'

export default {
  Layout,
  enhanceApp({ app }) {
    // 全局注册 Iconify 图标组件
    app.component('Icon', Icon)
  }
}