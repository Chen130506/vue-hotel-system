<!--
  根组件 (App.vue)
  功能：
  1. 作为整个应用的顶层容器
  2. 提供路由视图出口
  3. 自动重定向到登录页面
-->

<template>
  <!-- 路由视图：显示当前路由对应的组件 -->
  <router-view></router-view>
</template>
  
<script setup lang='js'>
/**
 * 导入路由实例
 * 用于实现页面跳转和导航控制
 */
import { useRouter } from 'vue-router';

/**
 * 获取路由器实例
 * 用于执行编程式导航
 */
const router = useRouter()

/**
 * 应用启动时自动跳转到登录页面
 * 确保用户首次访问时进入登录流程
 */
router.push("/Login")
</script>
  
<style>
  /* 根组件样式为空，所有样式在各子组件中定义 */
</style>