<!--
 * housing-home.vue - 酒店管理系统住房管理主页组件
 * 
 * 功能概述：
 * - 显示所有已入住客人的房间信息
 * - 提供退房操作便捷入口
 * - 分页展示入住信息
 * - 实时更新入住状态
 * 
 * 组件特性：
 * - 简洁的表格展示界面
 * - 内置分页功能
 * - 加载状态指示
 * - 空状态友好提示
 -->

<template>
  <div class="housing-home">
  <div class="header">
    <h2>住房管理 - 客人信息</h2>
    <div class="search-container">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入房间号、房型或入住人姓名进行搜索"
        clearable
        style="width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
  </div>

    <div class="occupied-rooms">
      <el-table :data="paginatedRooms" style="width: 100%" v-loading="loading">
        <el-table-column prop="number" label="房间号" width="100" />
        <el-table-column prop="typeName" label="房型" width="120" />
        <el-table-column prop="guestInfo.name" label="入住人" width="120" />
        <el-table-column prop="guestInfo.checkInTime" label="入住时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.guestInfo?.checkInTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="guestInfo.contact" label="联系方式" width="150" />
        <el-table-column label="退房日期" width="180">
          <template #default="scope">
            {{ scope.row.checkoutTime ? formatDate(scope.row.checkoutTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="openEditDialog(scope.row)" 
              :icon="Edit"
              :disabled="!!scope.row.checkoutTime"
            >
              修改
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleCheckOut(scope.row)"
              :disabled="!!scope.row.checkoutTime"
            >
              {{ scope.row.checkoutTime ? '已退房' : '办理退房' }}
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(scope.row)"
              :icon="Delete"
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
          :total="filteredRooms.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>

      <div v-if="filteredRooms.length === 0 && !loading" class="empty-state">
        <p v-if="!searchKeyword">暂无已入住客人信息</p>
        <p v-else>未找到匹配的入住信息</p>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改客人信息"
      width="500px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="入住人姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="editForm.contact" />
        </el-form-item>
        <el-form-item label="入住时间">
          <el-date-picker
            v-model="editForm.checkInTime"
            type="datetime"
            placeholder="选择日期时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import request from '../../request'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElDialog, ElMessageBox } from 'element-plus'

// 路由实例 - 用于页面导航
const router = useRouter()

// 数据状态
const occupiedRooms = ref([])      // 已入住房间列表
const loading = ref(true)          // 数据加载状态
const searchKeyword = ref('')      // 搜索关键词

// 分页配置
const currentPage = ref(1)         // 当前页码
const pageSize = ref(10)           // 每页显示条数

/**
 * 搜索筛选函数
 * 根据关键字过滤房间数据
 */
const filteredRooms = computed(() => {
  if (!searchKeyword.value.trim()) {
    return occupiedRooms.value
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return occupiedRooms.value.filter(room => {
    return (
      room.number?.toLowerCase().includes(keyword) ||
      room.typeName?.toLowerCase().includes(keyword) ||
      room.guestInfo?.name?.toLowerCase().includes(keyword) ||
      room.guestInfo?.contact?.toLowerCase().includes(keyword)
    )
  })
})

/**
 * 分页数据计算属性
 * 根据当前页码和每页大小计算显示的数据片段
 */
const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRooms.value.slice(start, end)
})

/**
 * 组件挂载生命周期钩子
 * 初始化获取已入住房间数据
 */
onMounted(async () => {
  await fetchOccupiedRooms()
})

/**
 * 获取入住房间数据（包括已退房记录）
 * 从API获取所有有客人入住记录的房间
 */
const fetchOccupiedRooms = async () => {
  try {
    loading.value = true
    const response = await request.get('/rooms')
    // 筛选出有客人信息的房间（包括已退房的）
    occupiedRooms.value = response.data.filter(room => room.guestInfo)
  } catch (error) {
    console.error('获取房间数据失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 处理搜索输入
 * 搜索时重置到第一页
 */
const handleSearch = () => {
  currentPage.value = 1
}

/**
 * 处理修改操作
 * @param {Object} room - 要修改的房间对象
 */
// 编辑对话框状态
const editDialogVisible = ref(false)
const currentEditRoom = ref(null)
const editForm = ref({
  name: '',
  contact: '',
  checkInTime: ''
})

/**
 * 打开编辑对话框
 * @param {Object} room - 要编辑的房间对象
 */
const openEditDialog = (room) => {
  currentEditRoom.value = room
  editForm.value = {
    name: room.guestInfo?.name || '',
    contact: room.guestInfo?.contact || '',
    checkInTime: room.guestInfo?.checkInTime || ''
  }
  editDialogVisible.value = true
}

/**
 * 提交编辑表单
 */
const submitEdit = async () => {
  try {
    loading.value = true
    // 更新房间数据
    const updatedRoom = {
      ...currentEditRoom.value,
      guestInfo: {
        ...currentEditRoom.value.guestInfo,
        ...editForm.value
      }
    }

    // 发送更新请求
    await request.patch(`/rooms/${currentEditRoom.value.id}`, updatedRoom)
    
    // 更新本地数据
    const index = occupiedRooms.value.findIndex(r => r.id === currentEditRoom.value.id)
    if (index !== -1) {
      occupiedRooms.value[index] = updatedRoom
    }
    
    ElMessage.success('客人信息更新成功')
    editDialogVisible.value = false
  } catch (error) {
    ElMessage.error('更新失败: ' + error.message)
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
 * 跳转到入住页面
 */
const goToCheckIn = () => {
  router.push('/Home/checkin')
}

/**
 * 跳转到退房页面
 */
const goToCheckOut = () => {
  router.push('/Home/checkout')
}

/**
 * 处理退房操作
 * @param {Object} room - 要办理退房的房间对象
 */
const handleCheckOut = (room) => {
  router.push({
    path: '/Home/checkout',
    query: { roomId: room.id }  // 传递房间ID参数
  })
}

/**
 * 处理删除操作 - 只清除客人信息，保留房间记录
 * @param {Object} room - 要清除客人信息的房间对象
 */
const handleDelete = async (room) => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要删除房间 ${room.number} 的入住记录吗？删除后房间将恢复为空闲状态。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 只清除客人信息，保留房间记录
    const updatedRoom = {
      ...room,
      guestInfo: null,
      isOccupied: false,
      checkoutTime: null
    }

    // 发送更新请求
    await request.patch(`/rooms/${room.id}`, updatedRoom)
    
    // 从本地数据中移除
    const index = occupiedRooms.value.findIndex(r => r.id === room.id)
    if (index !== -1) {
      occupiedRooms.value.splice(index, 1)
    }
    
    ElMessage.success('入住记录已删除，房间已恢复空闲')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {  // 不是用户取消操作
      console.error('删除失败:', error)
      ElMessage.error('删除失败: ' + error.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 住房管理主页容器样式 */
.housing-home {
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

/* 搜索容器样式 */
.search-container {
  margin-top: 10px;
}

/* 已入住房间表格区域样式 */
.occupied-rooms {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

/* 空状态提示样式 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

/* 按钮间距样式 */
.el-button + .el-button {
  margin-left: 8px;
}
/* 操作按钮容器样式 */
.occupied-rooms .el-table .cell .el-button {
  margin-bottom: 4px;
}
</style>