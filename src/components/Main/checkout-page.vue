<!--
 * checkout-page.vue - 酒店管理系统退房办理页面组件
 * 
 * 功能概述：
 * - 为已入住客人办理退房手续
 * - 支持从列表选择退房或直接指定房间退房
 * - 退房信息确认和二次确认
 * - 房间状态重置和清洁标记
 * 
 * 组件特性：
 * - 灵活的退房流程设计
 * - 操作前安全确认机制
 * - 实时状态同步更新
 * - 移动端适配界面
 -->

<template>
  <div class="checkout-page">
    <div class="header">
      <h2>办理退房</h2>
      <el-button type="default" @click="goBack">返回</el-button>
    </div>

    <div class="checkout-content">
      <!-- 如果有特定房间信息，显示退房表单 -->
      <div v-if="selectedRoom" class="checkout-form">
        <h3>退房信息</h3>
        <el-card>
          <div class="room-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="房间号">{{ selectedRoom.number }}</el-descriptions-item>
              <el-descriptions-item label="房型">{{ selectedRoom.typeName }}</el-descriptions-item>
              <el-descriptions-item label="入住人">{{ selectedRoom.guestInfo?.name || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="联系方式">{{ selectedRoom.guestInfo?.contact || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="入住时间" :span="2">
                {{ formatDate(selectedRoom.guestInfo?.checkInTime) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="action-buttons">
            <el-button type="danger" @click="showCheckoutConfirm" :loading="loading">办理退房</el-button>
          </div>
        </el-card>
      </div>

      <!-- 如果没有特定房间，显示已入住房间列表 -->
      <div v-else class="occupied-rooms">
        <h3>选择退房房间</h3>
        <el-table :data="occupiedRooms" style="width: 100%" v-loading="loading">
          <el-table-column prop="number" label="房间号" width="100" />
          <el-table-column prop="typeName" label="房型" width="120" />
          <el-table-column prop="guestInfo.name" label="入住人" width="120" />
          <el-table-column prop="guestInfo.checkInTime" label="入住时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.guestInfo?.checkInTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="danger" size="small" @click="selectRoom(scope.row)">
                办理退房
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="occupiedRooms.length === 0 && !loading" class="empty-state">
          <p>暂无已入住房间</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import request from '../../request'
import { todayStr, toLocalDateTimeStr } from '../../utils/date'
import { markBookingCompleted } from '../../utils/bookingSync'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由实例
const router = useRouter()          // 路由导航
const route = useRoute()            // 当前路由信息

// 数据状态
const loading = ref(false)          // 加载状态
const occupiedRooms = ref([])       // 已入住房间列表
const selectedRoom = ref(null)      // 选中的退房房间

// 从路由参数获取的房间ID
const routeRoomId = ref(route.query.roomId)

/**
 * 组件挂载生命周期钩子
 * 初始化数据并处理路由参数
 */
onMounted(async () => {
  await fetchOccupiedRooms()
  
  // 如果从房间详情页或住房管理跳转过来，自动选择房间
  if (routeRoomId.value) {
    const room = occupiedRooms.value.find(r => r.id === routeRoomId.value)
    if (room) {
      selectRoom(room)
    }
  }
})

/**
 * 获取已入住房间数据
 * 从API获取所有房间并筛选出已入住的房间
 */
const fetchOccupiedRooms = async () => {
  try {
    loading.value = true
    const response = await request.get('/rooms')
    occupiedRooms.value = response.data.filter(room => room.isOccupied)  // 筛选已入住房间
  } catch (error) {
    console.error('获取已入住房间失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 格式化日期时间显示
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期时间
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'  // 空值处理
  return new Date(dateString).toLocaleString('zh-CN')
}

/**
 * 选择退房房间
 * @param {Object} room - 要退房的房间对象
 */
const selectRoom = (room) => {
  selectedRoom.value = room
}

/**
 * 显示退房确认对话框
 * 二次确认防止误操作
 */
const showCheckoutConfirm = () => {
  ElMessageBox.confirm(
    `确定要为房间 ${selectedRoom.value.number} 的客人 ${selectedRoom.value.guestInfo?.name} 办理退房吗？`,
    '确认退房',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',  // 警告类型提示
    }
  ).then(() => {
    handleCheckout()  // 用户确认，执行退房
  }).catch(() => {
    // 用户取消操作
  })
}

/**
 * 办理退房操作
 * 更新房间状态并清除客人信息，同时更新每日统计数据
 */
const handleCheckout = async () => {
  try {
    loading.value = true

    const checkOutTime = toLocalDateTimeStr()  // 本地时间，避免 toISOString() 的 UTC 日期偏移

    // 准备更新的房间数据（保留客人信息但添加退房日期）
    const updatedRoom = {
      ...selectedRoom.value,
      isOccupied: false,    // 标记为未入住
      isCleaned: false,     // 退房后需要清洁
      checkoutTime: checkOutTime  // 添加退房时间
    }

    // 更新房间状态
    await request.patch(`/rooms/${selectedRoom.value.id}`, updatedRoom)

    // 同步把该房间对应的预订记录置为「已完成」
    // （此前没有任何入口回写预订状态，"已完成"永远不会出现，预订状态机断在"已入住"）
    await markBookingCompleted(selectedRoom.value.number, checkOutTime)

    // 更新每日退房统计数据
    await updateDailyCheckOutStats()
    
    ElMessage.success('办理退房成功！')
    // 返回到住房管理主页
    router.push('/Home/housing')
  } catch (error) {
    console.error('办理退房失败:', error)
    ElMessage.error('办理退房失败，请重试')
  } finally {
    loading.value = false
  }
}

/**
 * 更新每日退房统计数据
 * 在退房时自动增加当日的退房计数
 */
const updateDailyCheckOutStats = async () => {
  try {
    // 必须用本地日期：toISOString() 取的是 UTC 日期，东八区凌晨会算成"昨天"
    const today = todayStr()
    
    // 获取当前的每日统计数据
    const dailyStatsResponse = await request.get('/dailyStats')
    const dailyStats = dailyStatsResponse.data
    
    // 查找今天的退房统计数据 - 修正数据结构访问
    let todayCheckOutStat = dailyStats.checkOutStats?.find(stat => stat.date === today)
    let targetCheckOutStats = dailyStats.checkOutStats
    
    // 如果根级别没有checkOutStats，检查item对象
    if (!todayCheckOutStat && dailyStats.item?.checkOutStats) {
      todayCheckOutStat = dailyStats.item.checkOutStats.find(stat => stat.date === today)
      targetCheckOutStats = dailyStats.item.checkOutStats
    }
    
    if (todayCheckOutStat) {
      // 如果存在今天的统计数据，增加计数
      todayCheckOutStat.count += 1
    } else {
      // 如果不存在今天的统计数据，创建新的记录
      targetCheckOutStats.push({
        date: today,
        count: 1
      })
    }
    
    // 更新dailyStats数据
    await request.patch('/dailyStats', dailyStats)
  } catch (error) {
    console.error('更新每日退房统计数据失败:', error)
    // 失败不影响主要退房操作
  }
}

/**
 * 返回操作
 * 根据当前状态决定返回逻辑
 */
const goBack = () => {
  if (selectedRoom.value) {
    selectedRoom.value = null  // 清除选中的房间，返回房间列表
  } else {
    router.go(-1)  // 返回上一页
  }
}
</script>

<style scoped>
/* 退房办理页面容器样式 */
.checkout-page {
  padding: 20px;
}

/* 头部区域样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

/* 退房内容区域样式 */
.checkout-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

/* 退房表单标题样式 */
.checkout-form h3 {
  margin-bottom: 20px;
  color: #333;
}

/* 房间信息区域样式 */
.room-info {
  margin-bottom: 20px;
}

/* 操作按钮区域样式 */
.action-buttons {
  text-align: center;
  margin-top: 20px;
}

/* 已入住房间标题样式 */
.occupied-rooms h3 {
  margin-bottom: 20px;
  color: #333;
}

/* 空状态提示样式 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>