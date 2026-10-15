<template>
  <!-- 房态中心菜单标题 -->
  <h3>房态中心菜单</h3>
  <hr>
  <!-- 筛选区域 -->
  <div class="selroom">
    <!-- 筛选房间标题 -->
    <p class="select">筛选房间</p>

    <!-- 房型选择器 -->
    <el-select v-model="filterParams.roomType" clearable collapse-tags placeholder="选择房型">
      <el-option v-for="item in roomtype" :key="item.value" :label="item.label" :value="item.value"/>
    </el-select>

    <!-- 楼层选择器 -->
    <el-select v-model="filterParams.floor" clearable collapse-tags placeholder="选择楼层">
      <el-option v-for="item in floor" :key="item.value" :label="item.label" :value="item.value"/>
    </el-select>

    <!-- 房间状态选择器 -->
    <el-select v-model="filterParams.status" clearable collapse-tags placeholder="选择状态">
      <el-option v-for="item in type" :key="item.value" :label="item.label" :value="item.value"/>
    </el-select>
    
    <!-- 查询按钮 -->
    <el-button @click="applyFilters">查询</el-button>
    <!-- 重置按钮 -->
    <el-button @click="resetFilters">重置</el-button>
  </div>
</template>

<script setup lang="js">
// 引入 Vue 响应式功能和路由功能
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 获取路由器实例
const router = useRouter()

// 筛选参数响应式对象
const filterParams = ref({
  roomType: '',  // 房型筛选
  floor: '',     // 楼层筛选
  status: ''     // 状态筛选
})

// 房型选项数据
const roomtype = [
  {value: 'single',label:'单人房'},
  {value: 'double',label:'双人房'},
  {value: 'double-bed',label:'大床房'},
  {value: 'e-sports',label:'电竞房'},
  {value: 'presidential',label:'总统套房'}
]

// 楼层选项数据
const floor=[
  {value: '1',label:'一楼'},
  {value: '2',label:'二楼'}
]

// 房间状态选项数据
const type=[
  {value: 'isOccupied',label:'已入住'},
  {value: 'notOccupied',label:'空闲（未预订）'},
  {value: 'available',label:'所有可用房间'},
  {value: 'needsMaintenance',label:'维修中'},
  {value: 'booked',label:'已预订'},
  {value: 'dirty',label:'未清洁'}
]

/**
 * 应用筛选条件
 * 将筛选参数添加到 URL 查询字符串中，并更新路由
 */
const applyFilters = () => {
  const params = new URLSearchParams()
  
  // 只添加有值的参数
  if (filterParams.value.roomType) {
    params.append('roomType', filterParams.value.roomType)
  }
  if (filterParams.value.floor) {
    params.append('floor', filterParams.value.floor)
  }
  if (filterParams.value.status) {
    params.append('status', filterParams.value.status)
  }
  
  // 使用replace来更新URL，避免添加历史记录
  router.replace({ 
    path: '/Home/room-status', 
    query: Object.fromEntries(params) 
  })
}

/**
 * 重置筛选条件
 * 清空所有筛选参数并重置路由查询
 */
const resetFilters = () => {
  // 重置筛选参数为初始状态
  filterParams.value = {
    roomType: '',
    floor: '',
    status: ''
  }
  // 重置时清除URL中的查询参数
  router.replace({ path: '/Home/room-status' })
}
</script>

<style scoped>
    /* 标题样式：白色居中 */
    h3{
        color: #ffffff;
        text-align: center;
    }
    /* 筛选标题样式：白色文字 */
    .select{
      color: #ffffff;
    }
    /* 筛选区域样式：添加内边距 */
    .selroom{
      padding: 15px;
    }
    /* 选择器样式：上下边距 */
    .el-select{
      margin-top: 10px;
      margin-bottom: 10px;
    }
</style>