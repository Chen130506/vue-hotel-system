<template>
  <div>
    <!-- 住房管理菜单标题 -->
    <h3>住房管理菜单</h3>
    <hr>
    <el-menu>
      <!-- 办理入住菜单项 -->
      <el-menu-item index="checkin" @click="goToCheckIn">
        <span>办理入住</span>
      </el-menu-item>
      <!-- 办理退房菜单项 -->
      <el-menu-item index="checkout" @click="goToCheckOut">
        <span>办理退房</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
// 引入 Vue Router 用于路由跳转
import { useRouter } from 'vue-router'

// 获取路由器实例
const router = useRouter()

/**
 * 跳转到办理入住页面
 */
const goToCheckIn = () => {
  router.push('/Home/checkin')
}

/**
 * 跳转到办理退房页面
 */
const goToCheckOut = () => {
  router.push('/Home/checkout')
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
    /* 子菜单样式：更深的背景色 */
    .el-sub-menu .el-menu {
        background-color: #2a3036;
    }
</style>
