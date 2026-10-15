<!--
  主布局组件 (Home.vue)
  功能：
  1. 定义应用的整体页面布局结构
  2. 使用Element Plus的Container布局系统
  3. 实现Header + Aside + Main的三栏布局
  4. 使用命名路由视图渲染各区域内容
-->

<template>
  <!-- 通用布局容器 -->
  <div class="common-layout">
    <el-container>
      <!-- 顶部导航栏区域 -->
      <el-header>
        <!-- 命名路由视图：Header区域 -->
        <router-view name="Header"></router-view>
      </el-header>
      
      <!-- 主内容区域容器 -->
      <el-container>
        <!-- 左侧边栏区域 -->
        <el-aside width="200px">
          <!-- 命名路由视图：Aside区域（侧边菜单） -->
          <router-view name="Aside"></router-view>
        </el-aside>
        
        <!-- 主内容区域 -->
        <el-main>
          <!-- 命名路由视图：Main区域（页面主体内容） -->
          <router-view name="Main"></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang='js'>
  /**
   * Home组件使用Composition API的setup语法
   * 当前组件主要为布局容器，逻辑较少
   * 实际功能由Header、Aside、Main三个子路由视图分担
   */
</script>
    
<style>
  /* 左侧边栏样式 - 深色主题 */
    .el-aside {
        background-color: #353c43;
    }
    
  /* 顶部区域样式 */
    .el-header {
        height: 140px;
        background-color: #cbcbcb;
    }
    
  /* 主内容区域样式 */
    .el-main {
        /* 计算高度：视口高度减去头部高度 */
        height: calc(100vh - 120px);
        /* 重置Element Plus默认内边距 */
        padding: 0;
        margin: 0;
        background-color: #ffffff;
    }
    
  /* 布局容器样式 - 全屏高度 */
    .common-layout, .el-container {
        height: 100vh;
        margin: 0;
        padding: 0;
    }
</style>