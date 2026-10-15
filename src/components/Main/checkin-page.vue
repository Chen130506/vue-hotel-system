<!--
 * checkin-page.vue - 酒店管理系统入住办理页面组件
 * 
 * 功能概述：
 * - 为客人办理入住手续
 * - 支持楼层和房间号选择
 * - 入住信息收集和验证
 * - 从房间详情页自动填充信息
 * - 入住状态实时更新
 * 
 * 组件特性：
 * - 智能房间筛选逻辑
 * - 表单验证和安全控制
 * - 前后端数据同步
 * - 移动端适配
 -->

<template>
  <div class="checkin-page">
    <div class="header">
      <h2>办理入住</h2>
      <el-button type="default" @click="goBack">返回</el-button>
    </div>

    <div class="checkin-form">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="楼层" prop="floor">
          <el-select v-model="form.floor" placeholder="请选择楼层" @change="handleFloorChange">
            <el-option v-for="floor in floors" :key="floor" :label="`${floor}层`" :value="floor" />
          </el-select>
        </el-form-item>

        <el-form-item label="房间号" prop="roomId">
          <el-select v-model="form.roomId" placeholder="请选择房间号" :disabled="!form.floor">
            <el-option 
              v-for="room in availableRooms" 
              :key="room.id" 
              :label="room.number" 
              :value="room.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="房型">
          <el-input v-model="selectedRoomType" disabled />
        </el-form-item>

        <el-form-item label="入住时间" prop="checkInTime">
          <el-date-picker
            v-model="form.checkInTime"
            type="datetime"
            placeholder="选择入住时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>

        <el-form-item label="入住人姓名" prop="guestName">
          <el-input v-model="form.guestName" placeholder="请输入入住人姓名" />
        </el-form-item>

        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入联系方式" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleCheckIn" :loading="loading">确认入住</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import request from '../../request'
import { toLocalDateTimeStr } from '../../utils/date'
import { markBookingCheckedIn } from '../../utils/bookingSync'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
// 路由实例
const router = useRouter()      // 路由导航
const route = useRoute()        // 当前路由信息

// 表单和状态引用
const formRef = ref()           // 表单引用
const loading = ref(false)      // 加载状态

// 入住表单数据
const form = ref({
  floor: '',           // 楼层选择
  roomId: '',          // 房间ID
  checkInTime: '',     // 入住时间
  guestName: '',       // 客人姓名
  contact: ''          // 联系方式
})

// 楼层选项和数据
const floors = ref(['1', '2'])   // 楼层选项
const allRooms = ref([])                         // 所有房间数据
const routeRoomId = ref(route.query.roomId)      // 从路由参数获取的房间ID

/**
 * 可用房间计算属性
 * 根据楼层筛选可入住的房间（空闲或已预订的房间）
 */
const availableRooms = computed(() => {
  if (!form.value.floor) return []
  return allRooms.value.filter(room => 
    room.number.startsWith(form.value.floor) &&  // 匹配楼层
    // 可入住：未占用、无需维修，且（已清洁 或 已被预订）
    // 原写法 (A && B && C) || isBooked 会因运算优先级放行"维修中但已预订"的房间
    !room.isOccupied && !room.needsMaintenance && (room.isCleaned || room.isBooked)
  )
})

/**
 * 选中房间的类型计算属性
 * 显示选定房间的房型信息
 */
const selectedRoomType = computed(() => {
  if (!form.value.roomId) return ''
  const room = allRooms.value.find(r => r.id === form.value.roomId)
  return room ? room.typeName : ''
})

// 表单验证规则配置
const rules = {
  floor: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  roomId: [{ required: true, message: '请选择房间号', trigger: 'change' }],
  checkInTime: [{ required: true, message: '请选择入住时间', trigger: 'change' }],
  guestName: [{ required: true, message: '请输入入住人姓名', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
}

/**
 * 组件挂载生命周期钩子
 * 初始化房间数据并处理路由参数
 */
onMounted(async () => {
  await fetchAllRooms()
  // 如果从房间详情页跳转过来，自动填充房间信息
  if (routeRoomId.value) {
    const room = allRooms.value.find(r => r.id === routeRoomId.value)
    if (room) {
      form.value.floor = room.number[0]  // 提取楼层号
      await handleFloorChange()
      form.value.roomId = room.id
    }
  }
})

/**
 * 获取所有房间数据
 * 从API拉取完整的房间列表
 */
const fetchAllRooms = async () => {
  try {
    const response = await request.get('/rooms')
    allRooms.value = response.data
  } catch (error) {
    console.error('获取房间数据失败:', error)
  }
}

/**
 * 楼层变化处理
 * 切换楼层时清空房间选择
 */
const handleFloorChange = async () => {
  form.value.roomId = ''  // 清空房间选择
}

/**
 * 办理入住操作
 * 验证表单并更新房间入住状态
 */
const handleCheckIn = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()  // 表单验证
    loading.value = true

    const room = allRooms.value.find(r => r.id === form.value.roomId)
    if (!room) {
      ElMessage.error('未找到所选房间，请重新选择')
      return
    }

    const checkInTime = form.value.checkInTime || toLocalDateTimeStr()  // 未填入住时间时取当前本地时间

    // 准备更新的房间数据
    const updatedRoom = {
      ...room,
      isOccupied: true,      // 标记为已入住
      isBooked: false,       // 清除预订状态
      guestInfo: {
        name: form.value.guestName,
        contact: form.value.contact,
        checkInTime
      }
    }

    await request.patch(`/rooms/${room.id}`, updatedRoom)

    // 若该房间来自预订，同步把预订记录置为「已入住」
    // （此前只有「预订管理」页的"确认入住"会回写，从本页入住会让预订记录停在「未入住」）
    await markBookingCheckedIn(
      room.number,
      { name: form.value.guestName, contact: form.value.contact },
      checkInTime
    )

    ElMessage.success('办理入住成功！')
    router.push('/Home/housing')  // 跳转到住房管理页面
  } catch (error) {
    // 表单校验失败时 validate() reject 的是「按字段分组的普通对象」，不是 Error 实例，
    // 原先用 error.name !== 'ValidateError' 判断，字段没填全也会弹出"办理入住失败"
    if (error instanceof Error || error?.response || error?.request) {
      console.error('办理入住失败:', error)
      ElMessage.error('办理入住失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 重置表单
 * 清空所有输入字段
 */
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.go(-1)
}

/**
 * 监听房间ID变化
 * 可以在这里添加自动填充逻辑
 */
watch(() => form.value.roomId, (newVal) => {
  if (newVal) {
    const room = allRooms.value.find(r => r.id === newVal)
    if (room) {
      // 可以在这里自动填充其他信息
    }
  }
})
</script>

<style scoped>
/* 入住办理页面容器样式 */
.checkin-page {
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

/* 入住表单区域样式 */
.checkin-form {
  max-width: 600px;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
</style>