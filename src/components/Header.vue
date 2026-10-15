<!--
  顶部导航栏组件 (Header.vue)
  功能：
  1. 显示系统Logo和名称
  2. 提供主导航菜单
  3. 显示用户登录状态和信息
  4. 提供退出登录功能
  5. 支持多标签页登录状态同步
-->

<template>
  <!-- 左侧区域：Logo和系统名称 -->
  <div class="left">
      <!-- 办公大楼图标 -->
      <el-icon size="100"><OfficeBuilding/></el-icon>
      <h2>橘子酒店管理系统</h2>
  </div>
  
  <!-- 中间区域：主导航菜单 -->
  <el-space :size="0" spacer="" class="main">
      <!-- 导航菜单项：遍历菜单数组生成 -->
      <div v-for="(item, index) in menuItems" 
           :key="index"
           :class="{ active: activeIndex === index }"
           @click="navigateTo(index)">
        {{ item }}
      </div>
  </el-space>
  
  <!-- 右侧区域：用户信息 -->
  <div class="right">
    <!-- 用户头像圆形区域 -->
    <div class="round">
      <el-icon size="50"><User/></el-icon>
    </div>
    <!-- 用户名显示区域 -->
    <div class="username">
      <!-- 已登录状态：显示用户名和退出按钮 -->
      <p v-if="isLogin">
        {{ username }} 
        <el-button type="text" @click="handleLogout" class="logout-btn">退出</el-button>
      </p>
      <!-- 未登录状态：显示登录链接 -->
      <p v-else><router-link to="/Login">请登录</router-link></p>
    </div>
  </div>
</template>

<script setup lang='js'>
/**
 * 导入Vue响应式和生命周期函数
 */
import request from '../request'
import { ref, watch, onMounted, onUnmounted } from 'vue'

/**
 * 导入Vue Router，用于编程式导航
 */
import { useRouter, useRoute } from 'vue-router'

/**
 * 导入Element Plus组件，用于消息提示和确认对话框
 */
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 获取路由器实例与当前路由信息
 */
const router = useRouter()
const route = useRoute()

/**
 * 导航菜单配置
 * menuItems: 菜单显示文本数组
 * menuPaths: 对应的路由路径数组（与menuItems一一对应）
 */
const menuItems = ['首页', '房态中心', '预订管理', '住房管理']
const menuPaths = ['', 'room-status', 'booking', 'housing']

/**
 * 当前激活菜单索引（用于高亮显示）
 */
const activeIndex = ref(0)

/**
 * 根据当前路由反查应高亮的导航项
 * 原先 activeIndex 只在点击导航时更新，导致刷新页面、或经侧边栏 / 浏览器前进后退
 * 进入 /Home/booking 之类的页面时，顶部高亮仍停在「首页」
 */
const syncActiveIndexFromRoute = (path) => {
  // 取出 /Home/<segment> 里的 <segment>；/Home 本身对应「首页」
  const segment = path.replace(/^\/Home\/?/, '').split('/')[0]
  const index = menuPaths.indexOf(segment)
  activeIndex.value = index === -1 ? 0 : index
}

watch(() => route.path, (path) => syncActiveIndexFromRoute(path), { immediate: true })

/**
 * 登录状态标识
 */
const isLogin = ref(false)

/**
 * 当前用户名
 */
const username = ref('')

/**
 * 当前用户完整信息对象
 */
const currentUser = ref(null)

/**
 * 检查并更新用户登录状态
 * 从sessionStorage读取用户信息，判断是否已登录
 */
const checkLoginStatus = () => {
  // 从会话存储获取用户数据
  const userData = sessionStorage.getItem('hotel_user')
  if (userData) {
    // 解析用户JSON数据
    const user = JSON.parse(userData)
    isLogin.value = true
    username.value = user.username
    currentUser.value = user
  } else {
    // 未登录状态
    isLogin.value = false
    username.value = ''
    currentUser.value = null
  }
}

/**
 * 处理用户退出登录
 * 功能：
 * 1. 弹出确认对话框
 * 2. 同步后端用户状态
 * 3. 清除本地存储的登录信息
 * 4. 跳转到登录页面
 */
const handleLogout = async () => {
  try {
    // 弹出确认对话框
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 同步后端用户登录状态
    if (currentUser.value) {
      try {
        await request.patch(`/users/${currentUser.value.id}`, {
          isLogin: false
        })
      } catch (error) {
        // 后端更新失败不影响本地登出流程
        console.log('更新db.json登录状态失败，但继续执行登出')
      }
    }
    
    // 清除会话存储中的用户信息
    sessionStorage.removeItem('hotel_token')
    sessionStorage.removeItem('hotel_user')
    
    // 重置本地状态
    isLogin.value = false
    username.value = ''
    currentUser.value = null
    
    // 提示退出成功并跳转到登录页
    ElMessage.success('退出成功')
    router.push('/Login')
  } catch (error) {
    // 用户取消操作时不执行任何操作
    if (error !== 'cancel' && error !== 'close') {
      console.error('登出错误:', error)
    }
  }
}

/**
 * 导航到指定菜单页面
 * @param {number} index - 菜单索引
 */
const navigateTo = (index) => {
  // 更新激活菜单索引
  activeIndex.value = index
  // 跳转到对应路由
  router.push(`/Home/${menuPaths[index]}`)
}

/**
 * 处理本地存储变化事件
 * 功能：在多标签页环境下同步登录状态
 * @param {StorageEvent} event - 存储事件对象
 */
const handleStorageChange = (event) => {
  // 只处理用户信息变化
  if (event.key === 'hotel_user') {
    checkLoginStatus()
  }
}

/**
 * 组件挂载时执行
 */
onMounted(() => {
  // 初始化检查登录状态
  checkLoginStatus()
  // 监听存储事件（多标签页同步）
  window.addEventListener('storage', handleStorageChange)
})

/**
 * 组件卸载前执行
 */
onUnmounted(() => {
  // 移除存储事件监听器
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
    .el-icon{
        float: left;
        color: #0066ba;
    }
    h2{
      color: #000000;
      float: left;
      line-height: 100px;
    }
    .left{
      float: left;
      margin-top: 25px;
    }
    .right{
      margin-top: 30px;
    }
    .main{
      float: left;
      font-size: 20px;
      padding: 40px 50px 0px;
      margin-left: 100px;
    }
      .main div{
      text-align: center;
      width: 135px;
      height: 100px;
      line-height: 100px;
      color: white;
      background-color: #cbcbcb;
    }
    .main div.active {
      color: #000000;
      text-shadow: 0px 0px 10px #5a5a5a;
      background-color: #ffffff;
    }
    .username{
      float: right;
      line-height: 30px;
      color: rgb(0, 89, 255);
      font-size: 20px;
      margin-right: 10px;
    }
    .username .logout-btn {
      margin-left: 10px;
      color: #f56c6c;
      font-size: 12px;
    }
    .username .logout-btn:hover {
      color: #f78989;
    }
    .round{
      float: right;
      width: 50px;
      height: 50px;
      padding: 10px 10px 10px 10px;
      border-radius: 50%;
      background-color: #acdaffa0;
    }
</style>