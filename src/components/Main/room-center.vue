<!--
 * room-center.vue - 酒店管理系统房间中心组件
 * 
 * 功能概述：
 * - 显示所有房间的状态和基本信息
 * - 支持多种筛选方式（房型、楼层、状态）
 * - 通过路由参数实现动态筛选
 * - 点击房间跳转到详情页面
 * - 响应式房间卡片显示
 * 
 * 组件特性：
 * - 基于路由参数的筛选功能
 * - 多种房间状态可视化标识
 * - 交互式房间卡片设计
 * - 过滤器状态实时反馈
 -->

<template>
  <div class="rooms">
    <div v-if="filteredRooms.length === 0" class="no-results">
      <p>没有找到符合条件的房间</p>
    </div>
    <div v-else>
      <div v-if="filteredRooms.length !== allRooms.length" class="filter-info">
        已筛选出 {{ filteredRooms.length }} 个房间 (总数: {{ allRooms.length }})
      </div>
      <div v-for="(item, index) in filteredRooms" :key="index" 
           :class="getRoomStatusClass(item)" 
           @click="goToRoomDetail(item)"
           class="room-clickable">
        <h3>房间：{{ item.number }}</h3>
        <p>房型：{{ item.typeName }}</p>
        <p>状态：{{ getRoomStatus(item) }}</p>
      </div>
    </div>
  </div>
</template>
  
<script>
export default {
  data() {
    return {
      allRooms: [], // 存放所有房间数据的原始数组
      filteredRooms: [], // 存放筛选后的房间数据
      filterParams: {
        roomType: '',  // 房型筛选参数
        floor: '',     // 楼层筛选参数  
        status: ''     // 状态筛选参数
      },
      refreshInterval: null // 定时刷新间隔器
    }
  },
  /**
   * 组件挂载生命周期钩子
   * 初始化房间数据并设置路由监听
   */
  async mounted() {
    try {
      await this.fetchRoomsData(); // 初始获取数据
      
      // 处理初始路由查询参数
      this.handleRouteQuery();
      
      // 监听路由查询参数变化
      this.$watch(
        () => this.$route.query,
        () => {
          this.handleRouteQuery();  // 路由变化时重新应用筛选
        }
      );

      // 设置定时刷新，每5秒更新一次房间状态
      this.refreshInterval = setInterval(this.fetchRoomsData, 5000);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  },
  /**
   * 组件销毁生命周期钩子
   * 清除定时器
   */
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },
  methods: {
    /**
     * 获取房间数据
     * 从服务器获取最新的房间状态
     */
    async fetchRoomsData() {
      try {
        const roomsResponse = await request.get('/rooms');
        this.allRooms = roomsResponse.data;
        this.applyFilters(); // 重新应用筛选
      } catch (error) {
        console.error('获取房间数据失败:', error);
      }
    },
    /**
     * 处理路由查询参数
     * 根据URL参数更新筛选条件并应用筛选
     */
    handleRouteQuery() {
      const query = this.$route.query;
      
      // 从路由查询参数更新筛选参数
      this.filterParams.roomType = query.roomType || '';
      this.filterParams.floor = query.floor || '';
      this.filterParams.status = query.status || '';
      
      // 应用筛选条件
      this.applyFilters();
    },
    
    /**
     * 应用筛选条件
     * 根据当前筛选参数过滤房间数据
     */
    applyFilters() {
      let filtered = [...this.allRooms];  // 创建数据副本进行筛选
      
      // 按房型筛选
      if (this.filterParams.roomType) {
        filtered = filtered.filter(room => room.type === this.filterParams.roomType);
      }
      
      // 按楼层筛选（假设房间号第一个字符为楼层号）
      if (this.filterParams.floor) {
        filtered = filtered.filter(room => {
          const floorNum = room.number[0]; // 获取房间号的第一个字符作为楼层标识
          return floorNum === this.filterParams.floor;
        });
      }
      
      // 按状态筛选
      if (this.filterParams.status) {
        filtered = filtered.filter(room => {
          switch (this.filterParams.status) {
            case 'isOccupied':
              return room.isOccupied;  // 已入住房间
            case 'notOccupied':
              return !room.isOccupied && !room.needsMaintenance && room.isCleaned && !room.isBooked;  // 空闲可用房间（未预订）
            case 'available':
              return !room.isOccupied && !room.needsMaintenance && room.isCleaned;  // 所有可用房间（包括已预订）
            case 'needsMaintenance':
              return room.needsMaintenance;  // 需要维修房间
            case 'booked':
              return room.isBooked;  // 已预订房间
            case 'dirty':
              return !room.isCleaned;  // 待清洁房间
            default:
              return true;
          }
        });
      }
      
      this.filteredRooms = filtered;  // 更新筛选后的数据
    },
    
    /**
     * 获取房间状态文本描述
     * 根据房间属性判断并返回对应的状态文本
     * @param {Object} room - 房间对象
     * @returns {string} 房间状态文本
     */
    getRoomStatus(room) {
      if (room.isOccupied) {
        return '已入住';        // 当前有客人入住
      } else if (room.needsMaintenance) {
        return '需要维修';      // 房间需要维修
      } else if (!room.isCleaned) {
        return '待清洁';        // 房间需要清洁
      } else if (room.isBooked) {
        return '已预订';        // 房间已被预订
      } else {
        return '空闲';          // 房间可用
      }
    },
    
    /**
     * 获取房间状态对应的CSS类名
     * 根据房间属性返回不同的样式类以区分状态
     * @param {Object} room - 房间对象
     * @returns {string} CSS类名组合
     */
    getRoomStatusClass(room) {
      if (room.isOccupied) {
        return 'room ischecked';      // 红色边框 - 已入住
      } else if (room.needsMaintenance) {
        return 'room repair';         // 灰色边框 - 需要维修
      } else if (!room.isCleaned) {
        return 'room notcleaned';     // 橙色边框 - 待清洁
      } else if (room.isBooked) {
        return 'room booked';         // 紫色边框 - 已预订
      } else {
        return 'room notchecked';     // 绿色边框 - 空闲
      }
    },
    
    /**
     * 跳转到房间详情页面
     * @param {Object} room - 选中的房间对象
     */
    goToRoomDetail(room) {
      this.$router.push(`/Home/room-detail/${room.id}`);
    }
  }
}
</script>
  
<style scoped>
  /* 房间中心主容器样式 */
  .rooms{
    margin-top: 50px;
    margin-left: 50px;
  }
  
  /* 房间卡片基础样式 */
  .room{
    float: left;
    text-align: center;
    border: 2px solid #ccc;  /* 默认边框颜色 */
    border-radius: 10px;
    width: 200px;
    height: 150px;
    margin: 10px;
  }
  
  /* 可点击房间卡片交互样式 */
  .room-clickable {
    cursor: pointer;
    transition: all 0.3s ease;  /* 平滑过渡效果 */
  }
  
  .room-clickable:hover {
    transform: translateY(-2px);  /* 悬停上移效果 */
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);  /* 悬停阴影效果 */
  }
  
  /* 已入住房间样式 - 红色边框 */
  .ischecked{
    border: 2px solid red;
  }
  
  /* 空闲房间样式 - 绿色边框 */
  .notchecked{
    border: 2px solid green;
  }
  
  /* 待清洁房间样式 - 橙色边框 */
  .notcleaned{
    border: 2px solid orange;
  }
  
  /* 需要维修房间样式 - 灰色边框 */
  .repair{
    border: 2px solid gray;
  }
  
  /* 已预订房间样式 - 紫色边框 */
  .booked{
    border: 2px solid purple;
  }
  
  /* 筛选信息提示样式 */
  .filter-info {
    clear: both;  /* 清除浮动 */
    margin: 20px 0;
    padding: 10px;
    background-color: #f5f5f5;  /* 浅灰色背景 */
    border-radius: 5px;
    font-weight: bold;
  }
</style>