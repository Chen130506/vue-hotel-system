<template>
  <div>
    <!-- 预订管理标题 -->
    <h3>预订管理</h3>
    <hr>
    <el-menu>
      <!-- 快速筛选子菜单 -->
      <el-sub-menu index="filters">
        <template #title>
          <!-- 筛选图标 -->
          <el-icon><Filter /></el-icon>
          <span>快速筛选</span>
        </template>
        <!-- 全部预订选项 -->
        <el-menu-item index="all" @click="filterByStatus('')">
          <span>全部预订</span>
        </el-menu-item>
        <!-- 未入住筛选选项 -->
        <el-menu-item index="filter-active" @click="filterByStatus('未入住')">
          <el-tag type="warning" size="small">未入住</el-tag>
        </el-menu-item>
        <!-- 已入住筛选选项 -->
        <el-menu-item index="filter-checked-in" @click="filterByStatus('已入住')">
          <el-tag type="success" size="small">已入住</el-tag>
        </el-menu-item>
        <!-- 已取消筛选选项 -->
        <el-menu-item index="filter-cancelled" @click="filterByStatus('已取消')">
          <el-tag type="info" size="small">已取消</el-tag>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup>
// 引入 Vue Router 用于路由跳转
import { useRouter } from 'vue-router'
// 引入 Element Plus 筛选图标组件
import { Filter } from '@element-plus/icons-vue'

// 获取路由器实例
const router = useRouter()

/**
 * 根据预订状态筛选预订列表
 * @param {string} status - 筛选状态，''表示全部，'未入住'、'已入住'、'已取消'为具体状态
 */
const filterByStatus = (status) => {
  // 跳转到预订页面并携带筛选状态参数
  router.push(`/Home/booking?filterStatus=${status}`)
}
</script>

<style scoped>
    /* 标题样式：白色居中 */
    h3{
        color: #ffffff;
        text-align: center;
    }
    /* 菜单项样式：深色背景，白色文字 */
    .el-menu-item {
        background-color: #353c43;
        color: #ffffff;
    }
</style>
