<!--
 * Main.vue - 酒店管理系统主仪表板组件
 * 
 * 功能概述：
 * - 显示用户信息和登录状态
 * - 展示今日入住/退房统计数据
 * - 显示房间状态和入住率
 * - 提供房间类型分布的饼图可视化
 * - 展示近7天入住/退房趋势的折线图
 * 
 * 组件特性：
 * - 响应式布局设计
 * - 图表数据可视化
 * - 与后端API数据交互
 * - 窗口大小变化时自动调整图表
 -->
<!--
  首页仪表盘组件 (Main.vue)
  功能：
  1. 显示系统概览信息（用户信息、今日统计、房间状态）
  2. 使用ECharts展示数据可视化图表（饼图、折线图）
  3. 提供快速导航入口
  4. 实现响应式图表布局
  5. 实时数据更新
-->

<template>
  <!-- 仪表盘容器：使用CSS Grid布局 -->
  <div class="dashboard-container">
    <!-- 卡片1：用户信息（左上区域） -->
    <div class="card user-info">
      <h3>用户信息</h3>
      <!-- 已登录状态：显示用户详细信息 -->
      <div v-if="userData" class="user-content">
        <el-avatar :size="80" :src="userData.avatar || ''" />
        <div class="user-details">
          <p><strong>用户名：</strong>{{ userData.username }}</p>
          <p><strong>角色：</strong>{{ userData.role }}</p>
          <p><strong>登录时间：</strong>{{ formatTime(userData.loginTime) }}</p>
        </div>
      </div>
      <!-- 未登录状态：显示登录提示 -->
      <div v-else class="login-prompt">
        <p>请先登录系统</p>
        <el-button type="primary" @click="goToLogin">立即登录</el-button>
      </div>
    </div>

    <!-- 卡片2：今日统计（中上区域） -->
    <div class="card today-stats">
      <h3>今日统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <!-- 今日入住人数 -->
          <div class="stat-value">{{ todayCheckIns }}</div>
          <div class="stat-label">今日入住</div>
        </div>
        <div class="stat-item">
          <!-- 今日退房人数 -->
          <div class="stat-value">{{ todayCheckOuts }}</div>
          <div class="stat-label">今日退房</div>
        </div>
      </div>
    </div>

    <!-- 卡片3：房间状态（右上区域） -->
    <div class="card room-status">
      <h3>房间状态</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <!-- 空闲房间数/总房间数 -->
          <div class="stat-value">{{ availableRooms }} / {{ totalRooms }}</div>
          <div class="stat-label">空闲/总数</div>
        </div>
        <div class="stat-item">
          <!-- 入住率百分比 -->
          <div class="stat-value">{{ occupancyRate }}%</div>
          <div class="stat-label">入住率</div>
        </div>
      </div>
    </div>

    <!-- 卡片4：房间类型饼图（左下区域） -->
    <div class="card chart-container">
      <h3>房间类型分布</h3>
      <!-- ECharts饼图容器 -->
      <div ref="pieChart" class="chart"></div>
    </div>

    <!-- 卡片5：每日趋势线图（右下区域） -->
    <div class="card chart-container">
      <h3>近7天入住/退房趋势</h3>
      <!-- ECharts折线图容器 -->
      <div ref="lineChart" class="chart"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 导入Vue组合式API函数
 */
import request from '../request'
import { todayStr, dateStrOffset, toShortLabel } from '../utils/date'
import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 导入Vue Router，用于页面导航
 */
import { useRouter } from 'vue-router'

/**
 * 导入ECharts图表库
 */
import * as echarts from 'echarts'

/**
 * 导入Axios，用于HTTP请求
 */
/**
 * 获取路由器实例
 */
const router = useRouter()

/**
 * 当前登录用户数据
 * 包含用户名、角色、登录时间等信息
 */
const userData = ref(null)

/**
 * 统计数据变量
 */
const todayCheckIns = ref(0)      // 今日入住人数
const todayCheckOuts = ref(0)     // 今日退房人数
const availableRooms = ref(0)     // 空闲房间数
const totalRooms = ref(0)         // 总房间数
const occupancyRate = ref(0)      // 入住率百分比

/**
 * ECharts图表DOM引用
 * 使用ref获取模板中的DOM元素
 */
const pieChart = ref(null)    // 饼图容器引用
const lineChart = ref(null)   // 折线图容器引用

/**
 * ECharts图表实例
 * 用于管理图表生命周期
 */
let pieChartInstance = null   // 饼图实例
let lineChartInstance = null  // 折线图实例

/**
 * 获取并显示用户信息
 * 从sessionStorage读取已登录用户数据
 */
const fetchUserData = () => {
  const user = JSON.parse(sessionStorage.getItem('hotel_user'))
  if (user) {
    userData.value = {
      ...user,
      // 添加当前时间为登录时间
      loginTime: new Date().toISOString()
    }
  }
}

/**
 * 获取统计数据
 * 根据新逻辑统计入住和退房数据
 * 入住统计：遍历rooms，根据guestInfo.checkInTime判断
 * 退房统计：从dailyStats中获取
 */
const fetchStats = async () => {
  try {
    // 获取所有房间信息
    const roomsRes = await request.get('/rooms')
    const rooms = roomsRes.data
    totalRooms.value = rooms.length
    
    // 空闲房间数：与「房态中心」的空闲口径保持一致
    // （未入住 + 无需维修 + 已清洁 + 未被预订）。
    // 原先只判断 !isOccupied，会把"已预订 / 待清洁 / 需维修"的房间也算成空闲，
    // 导致同一间房在仪表盘与房态中心显示成不同结论
    availableRooms.value = rooms.filter(room =>
      !room.isOccupied && !room.needsMaintenance && room.isCleaned && !room.isBooked
    ).length

    // 入住率 = 已入住房间数 / 总房间数。
    // 原先用「总房数 - 空闲数」反推，会把待清洁、需维修、已预订的房间一并计入入住率
    const occupiedRooms = rooms.filter(room => room.isOccupied).length
    occupancyRate.value = totalRooms.value
      ? Math.round((occupiedRooms / totalRooms.value) * 100)
      : 0
    
    // 获取今日入住统计：遍历rooms，根据guestInfo.checkInTime判断
    // 必须用本地日期：toISOString() 取的是 UTC 日期，东八区凌晨会算成"昨天"
    const today = todayStr()
    const todayCheckInsCount = rooms.filter(room => {
      if (!room.guestInfo || !room.guestInfo.checkInTime) return false
      
      // 兼容处理不同的时间格式
      let checkInDateStr = room.guestInfo.checkInTime
      
      // 如果是ISO格式（包含'T'），按T分割
      if (checkInDateStr.includes('T')) {
        checkInDateStr = checkInDateStr.split('T')[0]
      }
      // 如果是空格分隔格式（如"2026-01-13 09:52"），按空格分割
      else if (checkInDateStr.includes(' ')) {
        checkInDateStr = checkInDateStr.split(' ')[0]
      }
      // 如果是其他格式，直接使用前10个字符（YYYY-MM-DD）
      else {
        checkInDateStr = checkInDateStr.substring(0, 10)
      }
      
      return checkInDateStr === today
    }).length
    todayCheckIns.value = todayCheckInsCount
    
    // 获取今日退房统计：从dailyStats中获取
    const dailyStatsRes = await request.get('/dailyStats')
    const dailyStats = dailyStatsRes.data
    
    // 查找今日退房数据 - 修正数据结构访问
    const todayCheckOut = dailyStats.checkOutStats?.find(
      stat => stat.date === today
    ) || dailyStats.item?.checkOutStats?.find(
      stat => stat.date === today
    )
    todayCheckOuts.value = todayCheckOut ? todayCheckOut.count : 0
    
    // 更新折线图数据 - 传入正确的数据结构
    updateLineChart(dailyStats)
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

  /**
   * 更新折线图数据
   * 结合dailyStats历史数据和今日实时数据更新图表
   * @param {Object} dailyStats - 每日统计数据对象
   */
  const updateLineChart = (dailyStats) => {
    if (!lineChartInstance) return
    
    // 生成近7天的日期数组
    const dates = []
    const checkInData = []
    const checkOutData = []
    
    // 获取今日日期用于特殊处理（必须是本地日期）
    const today = todayStr()

    for (let i = 6; i >= 0; i--) {
      // 统一使用本地日期：原先 dateStr 取的是 UTC 日期，
      // 而下面拼标签用的是本地 month/day，两者在凌晨会错位
      // （标签显示 1月15日，取到的却是 1月14日的数据）
      const dateStr = dateStrOffset(-i)
      const label = toShortLabel(dateStr)

      dates.push(label)
      
      // 从统计数据中查找对应日期的数据
      const checkInStat = dailyStats.checkInStats?.find(s => s.date === dateStr) || 
                         dailyStats.item?.checkInStats?.find(s => s.date === dateStr)
      const checkOutStat = dailyStats.checkOutStats?.find(s => s.date === dateStr) || 
                          dailyStats.item?.checkOutStats?.find(s => s.date === dateStr)
      
      let checkInCount = checkInStat ? checkInStat.count : 0
      let checkOutCount = checkOutStat ? checkOutStat.count : 0
      
      // 如果是今天，使用实时计算的入住数据（确保数据一致性）
      if (dateStr === today) {
        checkInCount = todayCheckIns.value
      }
      
      checkInData.push(checkInCount)
      checkOutData.push(checkOutCount)
    }
    
    // 更新图表数据
    lineChartInstance.setOption({
      xAxis: {
        data: dates
      },
      series: [
        {
          name: '入住',
          data: checkInData
        },
        {
          name: '退房',
          data: checkOutData
        }
      ]
    })
  }

/**
 * 初始化房间类型分布饼图
 * 展示不同类型房间的数量占比
 */
const initPieChart = () => {
  // 确保DOM元素存在
  if (!pieChart.value) return
  
  // 初始化ECharts实例
  pieChartInstance = echarts.init(pieChart.value)
  
  // 图表配置
  const option = {
    // 提示框配置
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    // 图例配置
    legend: {
      orient: 'vertical',      // 垂直布局
      right: 10,               // 右侧边距
      top: 'center'            // 垂直居中
    },
    // 数据系列配置
    series: [
      {
        name: '房间类型',
        type: 'pie',           // 饼图类型
        radius: ['50%', '70%'], // 环形饼图（内半径50%，外半径70%）
        avoidLabelOverlap: false, // 避免标签重叠
        // 环形样式配置
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        // 标签配置
        label: {
          show: false,
          position: 'center'
        },
        // 高亮样式配置
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        // 标签线配置
        labelLine: {
          show: false
        },
        // 图表数据
        data: [
          { value: 14, name: '单人间' },
          { value: 14, name: '双人间' },
          { value: 4, name: '大床房' },
          { value: 4, name: '电竞房' },
          { value: 4, name: '总统套房' }
        ]
      }
    ]
  }
  
  // 应用配置
  pieChartInstance.setOption(option)
}

  /**
   * 初始化入住/退房趋势折线图
   * 展示近7天的入住和退房数据变化
   */
  const initLineChart = () => {
    if (!lineChart.value) return
    
    lineChartInstance = echarts.init(lineChart.value)
    
    // 初始化空图表，等待实时数据更新
    const option = {
      // 提示框配置
      tooltip: {
        trigger: 'axis'
      },
      // 图例配置
      legend: {
        data: ['入住', '退房']
      },
      // 网格配置
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      // X轴配置
      xAxis: {
        type: 'category',        // 类目轴
        boundaryGap: false,      // 不留白，从原点开始
        data: []                 // 初始为空，等待数据填充
      },
      // Y轴配置
      yAxis: {
        type: 'value'            // 数值轴
      },
      // 数据系列配置
      series: [
        {
          name: '入住',
          type: 'line',          // 折线图
          data: [],              // 初始为空，等待数据填充
          smooth: true           // 平滑曲线
        },
        {
          name: '退房',
          type: 'line',
          data: [],              // 初始为空，等待数据填充
          smooth: true
        }
      ]
    }
    
    lineChartInstance.setOption(option)
  }

/**
 * 格式化时间字符串
 * 将ISO格式转换为本地化日期时间字符串
 * @param {string} timeString - ISO格式的时间字符串
 * @returns {string} 格式化后的本地时间字符串
 */
const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('zh-CN')
}

/**
 * 跳转登录页面
 */
const goToLogin = () => {
  router.push('/Login')
}

/**
 * 响应式调整图表大小
 * 监听窗口大小变化，确保图表自适应
 */
const resizeCharts = () => {
  pieChartInstance?.resize()
  lineChartInstance?.resize()
}

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  fetchUserData()    // 获取用户信息
  fetchStats()       // 获取统计数据
  initPieChart()     // 初始化饼图
  initLineChart()    // 初始化折线图
  window.addEventListener('resize', resizeCharts) // 监听窗口resize事件
})

/**
 * 组件卸载前清理
 */
onBeforeUnmount(() => {
  // 移除事件监听
  window.removeEventListener('resize', resizeCharts)
  // 销毁图表实例，释放内存
  pieChartInstance?.dispose()
  lineChartInstance?.dispose()
})
</script>

<style scoped>
/* 仪表板容器 - 使用CSS Grid布局 */
.dashboard-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;  /* 三列等宽布局 */
  grid-template-rows: auto auto;        /* 两行自适应高度 */
  gap: 20px;                            /* 网格间距 */
  padding: 20px;
  height: calc(100vh - 120px);          /* 计算高度，预留顶部空间 */
}

/* 通用卡片样式 */
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);  /* 卡片阴影效果 */
}

/* 用户信息卡片位置 */
.user-info {
  grid-column: 1;
  grid-row: 1;
}

/* 今日统计卡片位置 */
.today-stats {
  grid-column: 2;
  grid-row: 1;
}

/* 房间状态卡片位置 */
.room-status {
  grid-column: 3;
  grid-row: 1;
}

/* 图表容器位置 */
.chart-container {
  grid-column: span 1;  /* 每个图表占据一列 */
  grid-row: 2;
}

/* 图表样式 */
.chart {
  width: 100%;
  height: 300px;
}

/* 用户内容区域布局 */
.user-content {
  display: flex;
  align-items: center;
  gap: 20px;         /* 头像和详情之间的间距 */
  margin-top: 15px;
}

/* 用户详情文本样式 */
.user-details {
  flex: 1;           /* 占据剩余空间 */
}

.user-details p {
  margin: 8px 0;
}

/* 登录提示样式 */
.login-prompt {
  text-align: center;
  padding: 20px 0;
}

/* 统计网格布局 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* 两列等宽 */
  gap: 20px;
  margin-top: 20px;
}

/* 统计项样式 */
.stat-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;  /* 浅灰色背景 */
  border-radius: 6px;
}

/* 统计数值样式 */
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;       /* Element UI 主色调 */
}

/* 统计标签样式 */
.stat-label {
  font-size: 14px;
  color: #909399;       /* 次要文本颜色 */
  margin-top: 5px;
}

/* 卡片标题样式 */
h3 {
  margin: 0 0 15px 0;
  color: #303133;       /* 主要文本颜色 */
  font-size: 18px;
}
</style>