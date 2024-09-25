import { inject } from '@vercel/analytics';
import { onMounted } from 'vue'
import DefaultTheme from 'vitepress/theme'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    if (!import.meta.env.SSR) {
      onMounted(() => {
        inject()
      })
    }
  }
}