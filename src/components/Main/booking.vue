<!--
  预订管理组件 (booking.vue)
  功能：
  1. 管理客房预订的增删改查操作
  2. 支持多条件搜索和筛选
  3. 实现分页显示
  4. 提供预订确认入住、修改、取消、删除功能
  5. 与房间状态联动，同步预订和房间状态
  6. 支持侧边栏快速筛选（通过URL参数）
-->

<!--
 * booking.vue - 酒店管理系统预订管理组件
 * 
 * 功能概述：
 * - 预订记录的增删改查（CRUD）操作
 * - 预订状态管理（未入住、已入住、已取消、已完成）
 * - 搜索和筛选功能
 * - 分页显示预订记录
 * - 预订入住确认和取消操作
 * - 实时同步房间状态
 * 
 * 组件特性：
 * - 完整的预订生命周期管理
 * - 实时数据同步
 * - 批量操作支持
 * - 响应式表格设计
 * - 移动端适配
 -->

<!--
  预订管理组件 (booking.vue)
  
  功能概述：
  1. 管理客房预订的增删改查操作（CRUD）
  2. 支持多条件搜索和筛选（姓名、房间号、状态等）
  3. 实现分页显示，支持每页5/10/20/50条
  4. 提供预订确认入住、修改、取消、删除功能
  5. 与房间状态联动，同步预订和房间状态
  6. 支持侧边栏快速筛选（通过URL参数filterStatus）
  7. 使用Element Plus组件库构建界面
  
  数据流程：
  - 加载时获取所有预订记录
  - 搜索框和筛选器实时过滤数据
  - 分页组件控制每页显示数量
  - 操作按钮触发相应的API请求
  
  作者：酒店管理系统开发团队
  最后更新：2025年1月
-->
<template>
  <div class="booking-management">
    <!-- 头部搜索和操作区域 -->
    <div class="header">
      <h2>预订管理</h2>
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索预定记录（姓名、房间号、状态等）"
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="showNewBookingDialog">
          <el-icon><Plus /></el-icon>
          新建预订
        </el-button>
      </div>
    </div>

    <!-- 预定信息表格 -->
    <div class="booking-table">
      <el-table 
        :data="paginatedBookingData" 
        border stripe 
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="60"></el-table-column>
        <el-table-column prop="name" label="姓名" width="80"></el-table-column>
        <el-table-column prop="booktime" label="预定时间" width="120"></el-table-column>
        <el-table-column prop="bookroom" label="预定房间" width="100"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="130"></el-table-column>
        <el-table-column prop="checkInTime" label="入住时间" width="120"></el-table-column>
        <el-table-column prop="checkOutTime" label="离店时间" width="110"></el-table-column>
        <el-table-column prop="remarks" label="备注" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作"fixed="right">
          <template #default="scope">
            <el-button 
              type="success" 
              size="small" 
              @click="handleConfirmCheckIn(scope.row)"
              :disabled="scope.row.status !== '未入住'"
            >
              确认入住
            </el-button>
            <el-button type="primary" size="small" @click="handleModify(scope.row)">
              修改
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="openCancelDialog(scope.row)"
              :disabled="scope.row.status === '已取消'"
            >
              取消预订
            </el-button>
            <el-button
              v-if="scope.row.status === '已取消'"
              type="danger"
              plain
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="filteredBookingData.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <!-- 新建/修改预订弹窗 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form :model="bookingForm" :rules="rules" ref="bookingFormRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="bookingForm.name" placeholder="请输入客人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="bookingForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="预定房间" prop="bookroom">
          <el-select v-model="bookingForm.bookroom" placeholder="请选择房间">
            <el-option 
              v-for="room in availableRooms" 
              :key="room.id" 
              :label="`${room.number} (${room.typeName})`" 
              :value="room.number"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入住时间" prop="checkInTime">
          <el-date-picker
            v-model="bookingForm.checkInTime"
            type="date"
            placeholder="选择入住日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="离店时间" prop="checkOutTime">
          <el-date-picker
            v-model="bookingForm.checkOutTime"
            type="date"
            placeholder="选择离店日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="bookingForm.remarks" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ dialogType === 'new' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 取消预订确认对话框 -->
    <el-dialog
      title="取消预订确认"
      v-model="cancelDialogVisible"
      width="400px"
    >
      <p>确定要取消 <strong>{{ currentBooking?.name }}</strong> 的预订吗？</p>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmCancel" :loading="cancelling">
          确认取消
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import request from '../../request'
import { todayStr, toLocalDateTimeStr } from '../../utils/date'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
// 路由和状态管理
const route = useRoute()                    // 路由实例，用于获取查询参数
const loading = ref(false)                  // 数据加载状态
const bookingData = ref([])                 // 预订数据列表
const searchKeyword = ref('')               // 搜索关键词
const dialogVisible = ref(false)            // 新建/修改弹窗显示状态
const cancelDialogVisible = ref(false)      // 取消预订确认弹窗显示状态
const submitting = ref(false)               // 表单提交加载状态
const cancelling = ref(false)               // 取消操作加载状态
const dialogType = ref('new')               // 弹窗类型：'new' 或 'modify'
const currentBooking = ref(null)            // 当前操作的预订记录
const bookingFormRef = ref()                // 表单引用
const activeFilter = ref('')                // 当前筛选状态

// 分页配置
const currentPage = ref(1)                  // 当前页码
const pageSize = ref(10)                    // 每页显示条数

// 预订表单数据模型
const bookingForm = ref({
  name: '',            // 客人姓名
  phone: '',           // 联系电话
  bookroom: '',        // 预定房间号
  checkInTime: '',     // 入住时间
  checkOutTime: '',    // 离店时间
  remarks: '',         // 备注信息
  status: '未入住'     // 默认预订状态
})

// 可用房间列表 - 允许预订已预订但未入住的房间
const availableRooms = ref([])

// 表单验证规则配置
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  bookroom: [{ required: true, message: '请选择预定房间', trigger: 'change' }],
  checkInTime: [{ required: true, message: '请选择入住时间', trigger: 'change' }],
  checkOutTime: [{ required: true, message: '请选择离店时间', trigger: 'change' }]
}

// 计算属性
const dialogTitle = computed(() => dialogType.value === 'new' ? '新建预订' : '修改预订')

/**
 * 过滤后的预订数据计算属性
 * 根据搜索关键词和路由筛选条件筛选数据
 */
const filteredBookingData = computed(() => {
  let filtered = bookingData.value
  
  // 应用URL参数筛选（如按状态筛选）
  if (activeFilter.value) {
    filtered = filtered.filter(item => item.status === activeFilter.value)
  }
  
  // 应用搜索框多字段筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(keyword) ||         // 姓名搜索
      item.bookroom.toLowerCase().includes(keyword) ||     // 房间号搜索
      item.status.toLowerCase().includes(keyword) ||       // 状态搜索
      (item.phone && item.phone.includes(keyword)) ||      // 电话搜索
      (item.remarks && item.remarks.toLowerCase().includes(keyword))  // 备注搜索
    )
  }
  
  return filtered
})

/**
 * 分页数据计算属性
 * 根据当前页码和每页大小计算显示的数据片段
 */
const paginatedBookingData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBookingData.value.slice(start, end)
})

/**
 * 组件挂载时的生命周期钩子
 * 初始化数据和监听路由变化
 */
onMounted(async () => {
  await Promise.all([fetchBookedData(), fetchAvailableRooms()])
  handleRouteChange()  // 处理初始化时的路由参数
})

/**
 * 监听路由查询参数变化
 * 当路由参数变化时更新筛选条件
 */
watch(() => route.query, () => {
  handleRouteChange()
})

/**
 * 处理路由参数变化
 * 根据URL参数设置筛选状态
 */
const handleRouteChange = () => {
  const { filterStatus } = route.query
  activeFilter.value = filterStatus || ''
  // 如果有筛选状态，清除搜索框内容避免冲突
  if (filterStatus) {
    searchKeyword.value = ''
  }
}

/**
 * 获取预订数据
 * 从API获取所有预订记录
 */
const fetchBookedData = async () => {
  try {
    loading.value = true
    const response = await request.get('/booked')
    bookingData.value = response.data
  } catch (error) {
    console.error('获取预定数据失败:', error)
    ElMessage.error('获取预定数据失败')
  } finally {
    loading.value = false
  }
}

/**
 * 获取可用房间列表
 * 过滤显示可预订的房间：未占用且无需维修的房间（包含已预订房间用于修改操作）
 */
const fetchAvailableRooms = async () => {
  try {
    const response = await request.get('/rooms')
    availableRooms.value = response.data.filter(room =>
      // 与入住页、房间详情页保持同一口径：未占用、无需维修，且（已清洁 或 已被预订）。
      // 「已被预订」保留是为了修改预订时能把当前房间也列出来
      !room.isOccupied && !room.needsMaintenance && (room.isCleaned || room.isBooked)
    )
  } catch (error) {
    console.error('获取房间数据失败:', error)
  }
}

/**
 * 获取状态标签类型
 * 根据预订状态返回对应的Element UI标签类型
 * @param {string} status - 预订状态
 * @returns {string} 标签类型
 */
const getStatusTagType = (status) => {
  const typeMap = {
    '未入住': 'warning',    // 黄色警告
    '已入住': 'success',    // 绿色成功
    '已取消': 'info',       // 蓝色信息
    '已完成': ''            // 默认
  }
  return typeMap[status] || ''
}

/**
 * 搜索处理函数
 * 搜索逻辑通过计算属性自动实现，此函数仅作占位
 */
const handleSearch = () => {
  // 搜索结果通过计算属性 filteredBookingData 自动得出，
  // 但页码必须在此重置：否则在第 3 页时把结果筛到只剩 1 页，表格会因切片越界而显示空
  currentPage.value = 1
}

/**
 * 显示新建预订弹窗
 * 重置表单数据并打开新建弹窗
 */
const showNewBookingDialog = () => {
  dialogType.value = 'new'
  // 重置表单数据
  bookingForm.value = {
    name: '',
    phone: '',
    bookroom: '',
    checkInTime: '',
    checkOutTime: '',
    remarks: '',
    status: '未入住'
  }
  dialogVisible.value = true
}

/**
 * 修改预订操作
 * 打开修改弹窗并填充选中预订的数据
 * @param {Object} booking - 要修改的预订记录
 */
const handleModify = (booking) => {
  dialogType.value = 'modify'
  currentBooking.value = booking
  bookingForm.value = { ...booking }  // 浅拷贝预订数据到表单
  dialogVisible.value = true
}


/**
 * 提交预订表单
 * 处理新建和修改预订的提交操作
 */
const handleSubmit = async () => {
  if (!bookingFormRef.value) return
  
  try {
    await bookingFormRef.value.validate()  // 表单验证
    submitting.value = true
    
    const bookingData = {
      ...bookingForm.value,
      booktime: new Date().toLocaleDateString('zh-CN')  // 添加预订时间
    }
    
    if (dialogType.value === 'new') {
      // 新建预订操作
      
      // 首先检查房间是否已被预订 - 防止重复预订
      const roomToBook = await findRoomByNumber(bookingData.bookroom)
      if (roomToBook && roomToBook.isBooked) {
        ElMessage.error(`房间 ${bookingData.bookroom} 已被预订，请选择其他房间`)
        return
      }
      
      // 创建预订记录
      await request.post('/booked', bookingData)
      ElMessage.success('预订创建成功')
      
      // 同步更新房间状态 - 标记为已预订
      if (roomToBook) {
        await syncRoomBookingStatus(roomToBook, true)
      }
    } else {
      // 修改预订操作
      const previousRoomNumber = currentBooking.value ? currentBooking.value.bookroom : null
      await request.patch(`/booked/${currentBooking.value.id}`, bookingData)

      // 若更换了房间，需要同步释放旧房间、占用新房间的预订标记，
      // 否则旧房间的 isBooked 会一直停留在 true
      if (previousRoomNumber && previousRoomNumber !== bookingData.bookroom) {
        const oldRoom = await findRoomByNumber(previousRoomNumber)
        if (oldRoom) await syncRoomBookingStatus(oldRoom, false)

        const newRoom = await findRoomByNumber(bookingData.bookroom)
        if (newRoom) await syncRoomBookingStatus(newRoom, true)
      }

      ElMessage.success('预订修改成功')
    }
    
    await fetchBookedData()  // 刷新数据
    await fetchAvailableRooms()  // 刷新可用房间列表
    dialogVisible.value = false
  } catch (error) {
    // 表单校验失败时 validate() reject 的是「按字段分组的普通对象」（例如 { phone: [...] }），
    // 不是 Error 实例。原先写成 error.name !== 'ValidateError'，而表单里恰好有 name 字段，
    // 于是 error.name 是一个数组，检查恒为真 —— 字段没填全也会弹出"操作失败"
    if (error instanceof Error || error?.response || error?.request) {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

/**
 * 关闭弹窗
 * 重置表单并关闭弹窗
 */
const handleDialogClose = () => {
  dialogVisible.value = false
  bookingFormRef.value?.resetFields()  // 清除表单验证状态
}

/**
 * 确认入住操作
 * 将预订状态更新为"已入住"并同步房间状态
 * @param {Object} booking - 要确认入住的预订记录
 */
const handleConfirmCheckIn = async (booking) => {
  try {
    // 二次确认弹窗
    await ElMessageBox.confirm(
      `确定要确认 ${booking.name} 入住 ${booking.bookroom} 房间吗？`,
      '确认入住',
      {
        confirmButtonText: '确认入住',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    // 更新预订状态为已入住
    const updatedBooking = {
      ...booking,
      status: '已入住'
    }
    
    await request.patch(`/booked/${booking.id}`, updatedBooking)
    
    // 同步更新房间状态
    const roomResponse = await request.get(`/rooms?number=${booking.bookroom}`)
    if (roomResponse.data && roomResponse.data.length > 0) {
      const room = roomResponse.data[0]
      const updatedRoom = {
        ...room,
        isOccupied: true,    // 标记为已占用
        isBooked: false,     // 预订状态取消
        guestInfo: {
          name: booking.name,
          contact: booking.phone,       // 补上联系方式，否则住房管理的"联系方式"列为空
          checkInTime: toLocalDateTimeStr()  // 记录入住时间（本地时间，便于与"今日"比较）
        }
      }
      await request.patch(`/rooms/${room.id}`, updatedRoom)
    }
    
    // 更新每日入住统计数据
    await updateDailyCheckInStats()
    
    await fetchBookedData()  // 刷新数据
    await fetchAvailableRooms()  // 刷新可用房间列表
    ElMessage.success('入住确认成功')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('确认入住失败:', error)
      ElMessage.error('确认入住失败')
    }
  }
}

/**
 * 删除预订记录
 * 永久删除预订记录（不可恢复）
 * @param {Object} booking - 要删除的预订记录
 */
/**
 * 根据房间号查找对应的房间信息
 * @param {string} roomNumber - 房间号
 * @returns {Object|null} 房间对象或null
 */
const findRoomByNumber = async (roomNumber) => {
  try {
    const response = await request.get(`/rooms?number=${roomNumber}`)
    return response.data && response.data.length > 0 ? response.data[0] : null
  } catch (error) {
    console.error('查找房间失败:', error)
    return null
  }
}

/**
 * 同步更新房间的预订状态
 * @param {Object} room - 房间对象
 * @param {boolean} isBooked - 是否预订
 */
const syncRoomBookingStatus = async (room, isBooked) => {
  try {
    const updatedRoom = {
      ...room,
      isBooked: isBooked
    }
    await request.patch(`/rooms/${room.id}`, updatedRoom)
  } catch (error) {
    console.error('更新房间预订状态失败:', error)
  }
}

/**
 * 更新每日入住统计数据
 * 在入住确认时自动增加当日的入住计数
 */
const updateDailyCheckInStats = async () => {
  try {
    const today = todayStr()
    
    // 获取当前的每日统计数据
    const dailyStatsResponse = await request.get('/dailyStats')
    const dailyStats = dailyStatsResponse.data
    
    // db.json 中 dailyStats 的真实结构是 { item: { checkInStats, checkOutStats } }，
    // 直接取 dailyStats.checkInStats 会得到 undefined 并抛错（被下面的 catch 吞掉，
    // 表现为"入住统计永远不增加"），因此这里兼容两种结构
    const checkInStats = dailyStats.checkInStats || dailyStats.item?.checkInStats
    
    if (!checkInStats) {
      console.warn('未找到 checkInStats 数据，跳过入住统计更新')
      return
    }
    
    // 查找今天的入住统计数据
    const todayCheckInStat = checkInStats.find(stat => stat.date === today)
    
    if (todayCheckInStat) {
      // 如果存在今天的统计数据，增加计数
      todayCheckInStat.count += 1
    } else {
      // 如果不存在今天的统计数据，创建新的记录
      checkInStats.push({
        date: today,
        count: 1
      })
    }
    
    // 更新dailyStats数据
    await request.patch('/dailyStats', dailyStats)
  } catch (error) {
    console.error('更新每日入住统计数据失败:', error)
    // 失败不影响主要入住操作
  }
}

const handleDelete = async (booking) => {
  try {
    // 删除确认弹窗
    await ElMessageBox.confirm(
      `确定要删除 ${booking.name} 的预订记录吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await request.delete(`/booked/${booking.id}`)
    
    // 删除预订时，同步取消房间的预订状态
    const roomToUnbook = await findRoomByNumber(booking.bookroom)
    if (roomToUnbook) {
      await syncRoomBookingStatus(roomToUnbook, false)
    }
    
    await fetchBookedData()  // 刷新数据
    await fetchAvailableRooms()  // 刷新可用房间列表
    ElMessage.success('记录删除成功')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除记录失败:', error)
      ElMessage.error('删除记录失败')
    }
  }
}

/**
 * 打开「取消预订」确认弹窗
 * 取消预订属于软取消：把状态改为「已取消」并释放房间，记录本身保留以便追溯。
 * 原先「取消预订」按钮直接绑定 handleDelete，会把记录物理删除（数据不可恢复），
 * 而模板里这个确认弹窗的 cancelDialogVisible 从未被置为 true，属于不可达的死弹窗
 * @param {Object} booking - 要取消的预订记录
 */
const openCancelDialog = (booking) => {
  currentBooking.value = booking
  cancelDialogVisible.value = true
}

/**
 * 确认取消预订
 * 把预订状态置为「已取消」并释放房间的预订标记
 */
const confirmCancel = async () => {
  const booking = currentBooking.value
  if (!booking) return

  cancelling.value = true
  try {
    await request.patch(`/booked/${booking.id}`, {
      ...booking,
      status: '已取消'
    })

    // 同步释放房间的预订标记
    const roomToUnbook = await findRoomByNumber(booking.bookroom)
    if (roomToUnbook) {
      await syncRoomBookingStatus(roomToUnbook, false)
    }

    cancelDialogVisible.value = false
    currentBooking.value = null
    await fetchBookedData()
    await fetchAvailableRooms()
    ElMessage.success('预订已取消')
  } catch (error) {
    console.error('取消预订失败:', error)
    ElMessage.error('取消预订失败')
  } finally {
    cancelling.value = false
  }
}
</script>

<style scoped>
/* 预订管理主容器样式 */
.booking-management {
  padding: 20px;
}

/* 头部搜索区域样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 表格容器样式 */
.booking-table {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);  /* 卡片阴影效果 */
}
</style>