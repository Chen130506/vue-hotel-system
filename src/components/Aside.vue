<!--
  侧边栏容器组件 (Aside.vue)
  功能：
  1. 根据当前路由动态显示对应的侧边菜单
  2. 实现菜单组件的懒加载
  3. 提供良好的用户体验（无需刷新页面切换菜单）
-->

<template>
  <!-- 侧边栏容器 -->
  <div class="aside-container">
    <!-- 动态组件：根据路由显示对应的菜单 -->
    <component :is="currentMenuComponent" />
  </div>
</template>

<script setup lang='js'>
/**
 * 导入Vue响应式函数和侦听器
 */
import { ref, watch } from 'vue'

/**
 * 导入Vue Router，用于获取当前路由信息
 */
import { useRoute } from 'vue-router'

/**
 * 获取当前路由对象
 * 包含路径、参数、查询等信息
 */
const route = useRoute()

/**
 * 当前显示的菜单组件引用
 * 初始值为null，路由变化时更新
 */
const currentMenuComponent = ref(null)

/**
 * 路由路径到菜单组件的映射表
 * 键：路由路径
 * 值：动态导入的组件（懒加载）
 */
const menuComponentMap = {
  '/Home': () => import('./Aside/home-menu.vue'),           // 首页菜单
  '/Home/': () => import('./Aside/home-menu.vue'),          // 首页菜单（带斜杠）
  '/Home/room-status': () => import('./Aside/room-statusmenu.vue'),  // 房态中心菜单
  '/Home/booking': () => import('./Aside/bookingmenu.vue'),          // 预订管理菜单
  '/Home/housing': () => import('./Aside/housingmenu.vue'),          // 住房管理菜单
  // 办理入住 / 办理退房 属于住房管理流程，复用住房管理菜单
  // （否则侧边栏会退化成只剩一句欢迎语，用户找不到返回入口）
  '/Home/checkin': () => import('./Aside/housingmenu.vue'),
  '/Home/checkout': () => import('./Aside/housingmenu.vue'),
}

/**
 * 需要前缀匹配的路由
 * 房间详情是动态路由（/Home/room-detail/:id），无法用完整路径做键，归到房态中心菜单
 */
const prefixMenuMap = [
  ['/Home/room-detail', '/Home/room-status'],
]

/**
 * 根据路径解析出对应的菜单组件加载函数
 * @param {string} path - 当前路由路径
 */
const resolveMenu = (path) => {
  if (menuComponentMap[path]) return menuComponentMap[path]
  const hit = prefixMenuMap.find(([prefix]) => path.startsWith(prefix))
  return menuComponentMap[hit ? hit[1] : '/Home']
}

/**
 * 监听路由变化，更新菜单组件
 * 当路由切换时，根据新路径加载对应的菜单组件
 * 
 * watch配置：
 * - immediate: true 表示组件创建后立即执行一次
 * - deep: false 表示不需要深度监听（路径是字符串）
 */
watch(() => route.path, (newPath) => {
  resolveMenu(newPath)().then(module => {
    currentMenuComponent.value = module.default
  })
}, { immediate: true })
</script>

<style scoped>
/**
 * 侧边栏容器样式
 * 设置高度为100%，填满父元素
 */
.aside-container {
  height: 100%;
}
</style>