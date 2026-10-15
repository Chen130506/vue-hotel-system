import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 构建产物使用相对路径引用资源。
  // 这样无论站点部署在根路径（如 Vercel）还是子路径
  // （如 GitHub Pages 的 /vue-hotel-system/），JS / CSS 都能正确加载。
  // 本地 npm run dev 不受影响 —— 开发模式下 base 始终按 '/' 处理。
  base: './',
})
