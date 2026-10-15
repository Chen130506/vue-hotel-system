<!--
 * room-detail.vue - 酒店管理系统房间详情组件
 * 
 * 文件概述：
 * 这是酒店管理系统的核心页面组件，负责展示和操作单个房间的完整信息。
 * 采用Vue 2的Options API编写，支持响应式状态管理和动态操作控制。
 * 
 * 功能模块：
 * 1. 房间信息展示 - 显示房号、房型、当前状态等详细信息
 * 2. 入住退房管理 - 控制客人入住和退房的业务流程
 * 3. 房间状态维护 - 管理清洁、维修等维护状态
 * 4. 权限控制 - 基于房间状态的动态操作按钮控制
 * 
 * 技术特性：
 * - 响应式设计：支持桌面端和移动端自适应
 * - 状态驱动UI：操作按钮根据当前房间状态智能显示
 * - 路由参数处理：通过URL参数接收房间ID
 * - REST API集成：与json-server后端无缝交互
 * 
 * 作者：酒店管理系统开发团队
 * 版本：1.0.0
 * 最后更新：2025年1月
 -->

<template>
  <!-- 房间详情页面主容器 -->
  <div class="room-detail">
    <!-- 页面标题和导航区域 -->
    <div class="room-header">
      <h2>房间详情</h2>
      <!-- 返回按钮：提供便捷的页面导航 -->
      <button class="back-button" @click="goBack">返回</button>
    </div>
    
    <!-- 房间信息内容区域：根据room数据是否存在条件渲染 -->
    <div v-if="room" class="room-info">
      <!-- 基本信息展示区域：显示房间的核心属性 -->
      <div class="info-section">
        <h3>{{ room.number }} 房间信息</h3>
        <!-- 使用CSS Grid布局展示房间信息 -->
        <div class="info-grid">
          <!-- 房间号信息：唯一标识 -->
          <div class="info-item">
            <label>房间号：</label>
            <span>{{ room.number }}</span>
          </div>
          <!-- 房型信息：显示房间类型名称 -->
          <div class="info-item">
            <label>房型：</label>
            <span>{{ room.typeName }}</span>
          </div>
          <!-- 动态状态显示：根据实际状态改变颜色和文本 -->
          <div class="info-item">
            <label>状态：</label>
            <span :class="getStatusClass(room)">{{ getRoomStatus(room) }}</span>
          </div>
          <!-- 客人信息：仅当有入住者时显示 -->
          <div v-if="room.guestInfo" class="info-item">
            <label>入住客人：</label>
            <span>{{ room.guestInfo.name || '未知' }}</span>
          </div>
        </div>
      </div>

      <!-- 入住退房操作区域：核心业务流程入口 -->
      <div class="action-section">
        <h3>入住退房操作</h3>
        <!-- 操作按钮容器：水平排列的按钮组 -->
        <div class="action-buttons">
          <!-- 入住按钮：动态显示文本和状态 -->
          <button 
            :class="['action-button', 'check-in-btn', { 'disabled': !canCheckIn }]"
            :disabled="!canCheckIn"
            @click="handleCheckIn"
          >
            {{ canCheckIn ? '办理入住' : '不可入住' }}
          </button>
          <!-- 退房按钮：基于条件激活/禁用 -->
          <button 
            :class="['action-button', 'check-out-btn', { 'disabled': !canCheckOut }]"
            :disabled="!canCheckOut"
            @click="handleCheckOut"
          >
            {{ canCheckOut ? '办理退房' : '不可退房' }}
          </button>
        </div>
      </div>

      <!-- 房间状态维护区域：管理清洁和维修状态 -->
      <div class="status-section">
        <h3>房间状态管理</h3>
        <!-- 状态管理按钮组：用于维护房间的清洁和维修状态 -->
        <div class="status-buttons">
          <!-- 清洁状态按钮：标记房间为已清洁 -->
          <button 
            :class="['status-button', 'clean-btn', { 'disabled': !canMarkAsCleaned }]"
            :disabled="!canMarkAsCleaned"
            @click="handleMarkAsCleaned"
          >
            {{ canMarkAsCleaned ? '已清洁' : '已清洁' }}
          </button>
          <!-- 维修请求按钮：标记房间需要维修 -->
          <button 
            :class="['status-button', 'maintenance-btn', { 'disabled': !canMarkAsNeedMaintenance }]"
            :disabled="!canMarkAsNeedMaintenance"
            @click="handleMarkAsNeedMaintenance"
          >
            {{ canMarkAsNeedMaintenance ? '需维修' : '需维修' }}
          </button>
          <!-- 维修完成按钮：标记故障已修复 -->
          <button 
            :class="['status-button', 'repaired-btn', { 'disabled': !canMarkAsRepaired }]"
            :disabled="!canMarkAsRepaired"
            @click="handleMarkAsRepaired"
          >
            {{ canMarkAsRepaired ? '已维修' : '已维修' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态指示器：当房间数据正在加载时显示 -->
    <div v-else class="loading">
      <p>正在加载房间信息...</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      room: null  // 存储当前房间的详细数据
    }
  },
  computed: {
    /**
     * 判断是否可以办理入住
     * 条件：房间未被占用、无需维修、已清洁，或者是已预订状态
     */
    canCheckIn() {
      if (!this.room) return false
      // 必须先用「不可入住」的条件短路：原写法是 (A && B && C) || isBooked，
      // 一旦房间既 isBooked 又 needsMaintenance（或已占用），运算优先级会让它被放行
      if (this.room.isOccupied || this.room.needsMaintenance) return false
      return this.room.isCleaned || this.room.isBooked
    },
    /**
     * 判断是否可以办理退房
     * 条件：房间当前有客人入住
     */
    canCheckOut() {
      if (!this.room) return false
      return this.room.isOccupied
    },
    /**
     * 判断是否可以标记为已清洁
     * 条件：房间未被占用且需要清洁
     */
    canMarkAsCleaned() {
      if (!this.room) return false
      return !this.room.isOccupied && !this.room.isCleaned
    },
    /**
     * 判断是否可以标记为需维修
     * 条件：房间未被占用且当前状态正常
     */
    canMarkAsNeedMaintenance() {
      if (!this.room) return false
      return !this.room.isOccupied && !this.room.needsMaintenance
    },
    /**
     * 判断是否可以标记为已维修
     * 条件：房间未被占用且需要维修
     */
    canMarkAsRepaired() {
      if (!this.room) return false
      return !this.room.isOccupied && this.room.needsMaintenance
    }
  },
  /**
   * 组件挂载生命周期钩子
   * 根据路由参数获取房间详情
   */
  async mounted() {
    const roomId = this.$route.params.id
    await this.fetchRoomDetail(roomId)
  },
  methods: {
    /**
     * 获取房间详细信息
     * @param {string} roomId - 房间ID
     */
    async fetchRoomDetail(roomId) {
      try {
        const response = await request.get(`/rooms/${roomId}`)
        this.room = response.data
      } catch (error) {
        console.error('获取房间详情失败:', error)
        this.room = null
      }
    },

    /**
     * 获取房间状态文本描述
     * @param {Object} room - 房间对象
     * @returns {string} 状态文本
     */
    getRoomStatus(room) {
      if (room.isOccupied) {
        return '已入住'        // 当前有客人入住
      } else if (room.needsMaintenance) {
        return '需要维修'      // 房间需要维修
      } else if (!room.isCleaned) {
        return '待清洁'        // 房间需要清洁
      } else if (room.isBooked) {
        return '已预订'        // 房间已被预订
      } else {
        return '空闲'          // 房间可用
      }
    },

    /**
     * 获取房间状态样式类名
     * @param {Object} room - 房间对象
     * @returns {string} CSS类名
     */
    getStatusClass(room) {
      if (room.isOccupied) {
        return 'status-occupied'       // 红色 - 已入住
      } else if (room.needsMaintenance) {
        return 'status-maintenance'    // 橙色 - 需维修
      } else if (!room.isCleaned) {
        return 'status-dirty'          // 深橙 - 待清洁
      } else if (room.isBooked) {
        return 'status-booked'         // 紫色 - 已预订
      } else {
        return 'status-available'      // 绿色 - 空闲
      }
    },

    /**
     * 返回上一页
     */
    goBack() {
      this.$router.go(-1)
    },

    /**
     * 处理入住操作
     * 跳转到入住办理页面
     */
    async handleCheckIn() {
      if (!this.canCheckIn) return
      
      // 跳转到住房管理的入住页面，传递房间ID
      this.$router.push(`/Home/checkin?roomId=${this.room.id}`);
    },

    /**
     * 处理退房操作
     * 跳转到退房办理页面
     */
    async handleCheckOut() {
      if (!this.canCheckOut) return
      
      // 跳转到住房管理的退房页面，传递房间ID
      this.$router.push(`/Home/checkout?roomId=${this.room.id}`);
    },

    /**
     * 标记房间为已清洁
     * 更新房间清洁状态
     */
    async handleMarkAsCleaned() {
      if (!this.canMarkAsCleaned) return
      
      try {
        const updatedRoom = {
          ...this.room,
          isCleaned: true  // 设置清洁状态为true
        }
        
        await request.patch(`/rooms/${this.room.id}`, updatedRoom)
        await this.fetchRoomDetail(this.room.id)  // 刷新房间数据
        alert('房间已标记为已清洁！')
      } catch (error) {
        console.error('标记清洁状态失败:', error)
        alert('操作失败，请重试')
      }
    },

    /**
     * 标记房间为需要维修
     * 设置维修状态并可能需要重新清洁
     */
    async handleMarkAsNeedMaintenance() {
      if (!this.canMarkAsNeedMaintenance) return
      
      try {
        const updatedRoom = {
          ...this.room,
          needsMaintenance: true,   // 设置需要维修
          isCleaned: false          // 维修前可能需要重新清洁
        }
        
        await request.patch(`/rooms/${this.room.id}`, updatedRoom)
        await this.fetchRoomDetail(this.room.id)  // 刷新房间数据
        alert('房间已标记为需维修！')
      } catch (error) {
        console.error('标记维修状态失败:', error)
        alert('操作失败，请重试')
      }
    },

    /**
     * 标记房间为已维修
     * 完成维修后重置相关状态
     */
    async handleMarkAsRepaired() {
      if (!this.canMarkAsRepaired) return
      
      try {
        const updatedRoom = {
          ...this.room,
          needsMaintenance: false,  // 清除维修状态
          isCleaned: false          // 维修后需要清洁（原为 true，与注释相反，
                                    // 会让刚维修完的房间直接变成"空闲"并可被入住，跳过了清洁环节）
        }
        
        await request.patch(`/rooms/${this.room.id}`, updatedRoom)
        await this.fetchRoomDetail(this.room.id)  // 刷新房间数据
        alert('房间已标记为已维修！')
      } catch (error) {
        console.error('标记维修完成失败:', error)
        alert('操作失败，请重试')
      }
    }
  }
}
</script>

<style scoped>
/* 房间详情主容器样式 */
.room-detail {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

/* 头部区域样式 */
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 15px;
}

/* 返回按钮样式 */
.back-button {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.back-button:hover {
  background-color: #e0e0e0;
}

/* 房间信息卡片样式 */
.room-info {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* 各个功能区样式 */
.info-section, .action-section {
  margin-bottom: 30px;
}

/* 区域标题样式 */
.info-section h3, .action-section h3 {
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* 信息网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

/* 信息项样式 */
.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.info-item label {
  font-weight: bold;
  color: #666;
}

/* 操作按钮区域样式 */
.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

/* 操作按钮基础样式 */
.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

/* 入住按钮样式 - 绿色 */
.check-in-btn {
  background-color: #4CAF50;
  color: white;
}

.check-in-btn:hover:not(.disabled) {
  background-color: #45a049;
}

/* 退房按钮样式 - 橙色 */
.check-out-btn {
  background-color: #ff9800;
  color: white;
}

.check-out-btn:hover:not(.disabled) {
  background-color: #f57c00;
}

/* 禁用状态按钮样式 */
.action-button.disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}

/* 状态文本颜色样式 */
.status-occupied {
  color: #f44336;      /* 红色 - 已入住 */
  font-weight: bold;
}

.status-maintenance {
  color: #ff9800;      /* 橙色 - 需维修 */
  font-weight: bold;
}

.status-dirty {
  color: #ff5722;      /* 深橙 - 待清洁 */
  font-weight: bold;
}

.status-booked {
  color: #9c27b0;      /* 紫色 - 已预订 */
  font-weight: bold;
}

.status-available {
  color: #4CAF50;      /* 绿色 - 空闲 */
  font-weight: bold;
}

/* 状态管理区域样式 */
.status-section {
  margin-bottom: 30px;
}

.status-section h3 {
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.status-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

/* 状态按钮基础样式 */
.status-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

/* 清洁按钮样式 - 蓝色 */
.clean-btn {
  background-color: #2196F3;
  color: white;
}

.clean-btn:hover:not(.disabled) {
  background-color: #1976D2;
}

/* 维修按钮样式 - 黄色 */
.maintenance-btn {
  background-color: #FFC107;
  color: white;
}

.maintenance-btn:hover:not(.disabled) {
  background-color: #FFA000;
}

/* 维修完成按钮样式 - 紫色 */
.repaired-btn {
  background-color: #9C27B0;
  color: white;
}

.repaired-btn:hover:not(.disabled) {
  background-color: #7B1FA2;
}

.status-button.disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}

/* 加载状态样式 */
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  .room-detail {
    margin: 10px;
    padding: 10px;
  }
  
  .room-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>

<!--
  CSS样式详细说明：
  
  布局系统：
  - 使用Flexbox和Grid实现响应式布局
  - 最大宽度800px确保内容在大屏幕上不会过度拉伸
  - 采用卡片式阴影设计增强视觉层次
  
  颜色系统：
  - 主色调：#4CAF50 (绿色) - 正向操作
  - 警告色调：#ff9800 (橙色) - 退房操作
  - 状态色调：多种颜色对应不同业务状态
  - 禁用状态：#ccc (灰色) - 不可用状态
  
  交互设计：
  - hover效果提供操作反馈
  - 过渡动画增强用户体验
  - 禁用状态防止误操作
  
  响应式设计：
  - 移动端采用垂直布局
  - 按钮在窄屏下自动换行
  - 适配小屏设备触摸操作
  
  维护说明：
  - 所有样式都使用scoped限定作用域
  - 变量命名遵循BEM方法论
  - 便于后续维护和扩展
-->