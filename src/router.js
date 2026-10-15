/**
 * 路由配置文件 (router.js)
 * 功能：定义应用的路由结构、实现页面导航和权限控制
 */

// 导入Vue Router核心函数
import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 创建路由实例
 * 配置选项：
 * - history: 使用Hash模式路由（URL格式：#/path），兼容性好无需服务器配置
 * - routes: 定义路由规则，路径与组件的映射关系
 */
const router = createRouter({ 
  // 设置路由模式：Hash模式
  history: createWebHashHistory(),

  // 设置路由：路径和组件的对应关系
  routes: [   
      /**
       * 根路径重定向
       * 访问/时自动跳转到/Home
       */
      {path: '/', redirect: '/Home'},
      
      /**
       * 主页面路由组（需要认证）
       * 使用嵌套路由实现Header + Aside + Main的三栏布局
       * meta.requiresAuth: 标记该路由需要登录才能访问
       */
      {path: '/Home', component: () => import('./components/Home.vue'),
        meta: { requiresAuth: true },
        children:[
          /**
           * 首页（仪表盘）
           * 路径：/Home 或 /Home/
           * 布局：显示系统概览信息
           */
          {path: '', 
            components: {
              Aside: () => import('./components/Aside.vue'),
              Header: () => import('./components/Header.vue'),
              Main: () => import('./components/Main.vue')
            }
          },
          
          /**
           * 房态中心页面
           * 路径：/Home/room-status
           * 功能：显示所有房间状态，支持筛选和房间详情查看
           */
          {path: 'room-status', 
            components: {
              Aside: () => import('./components/Aside.vue'),
              Header: () => import('./components/Header.vue'),
              Main: () => import('./components/Main/room-center.vue')
            }
          },
          
          /**
           * 预订管理页面
           * 路径：/Home/booking
           * 功能：管理客房预订，支持增删改查和状态筛选
           */
          {path: 'booking', 
            components: {
              Aside: () => import('./components/Aside.vue'),
              Header: () => import('./components/Header.vue'),
              Main: () => import('./components/Main/booking.vue')
            }
          },
          
          /**
           * 住房管理页面
           * 路径：/Home/housing
           * 功能：显示已入住客人列表，办理退房操作
           */
          {path: 'housing', 
            components: {
              Aside: () => import('./components/Aside.vue'),
              Header: () => import('./components/Header.vue'),
              Main: () => import('./components/Main/housing-home.vue')
            }
          },
          
          /**
           * 办理入住页面
           * 路径：/Home/checkin
           * 功能：选择房间、填写客人信息完成入住登记
           */
          {path: 'checkin', 
            components: {
              Aside: () => import('./components/Aside.vue'),
              Header: () => import('./components/Header.vue'),
              Main: () => import('./components/Main/checkin-page.vue')
            }
          },
          
          /**
           * 办理退房页面
           * 路径：/Home/checkout
           * 功能：显示已入住房间信息，确认退房操作
           */
          {path: 'checkout', 
            components: {
              Aside: () => import('./components/Aside.vue'),
              Header: () => import('./components/Header.vue'),
              Main: () => import('./components/Main/checkout-page.vue')
            }
          },
          
          /**
           * 房间详情页面
           * 路径：/Home/room-detail/:id
           * 功能：显示单个房间的详细信息和操作按钮
           * 动态路由参数：id - 房间唯一标识
           */
          {path: 'room-detail/:id', 
            components: {
              Aside: () => import('./components/Aside.vue'),
              Header: () => import('./components/Header.vue'),
              Main: () => import('./components/Main/room-detail.vue')
            }
          }
        ]
      },
      
      /**
       * 登录页面（无需认证）
       * 路径：/Login
       * 功能：用户身份验证
       */
      {path: '/Login', component: () => import('./components/Login.vue')},
      
      /**
       * 注册页面（无需认证）
       * 路径：/Register
       * 功能：新用户注册
       */
      {path: '/Register', component: () => import('./components/Register.vue')},

      /**
       * 兜底路由
       * 访问未定义的路径时重定向到首页，避免渲染空白页
       */
      {path: '/:pathMatch(.*)*', redirect: '/Home'}
  ]
})

/**
 * 路由守卫 - 全局前置守卫
 * 功能：在路由跳转前检查用户登录状态，实现权限控制
 * 执行时机：每次路由变化前
 */
router.beforeEach((to, from, next) => {
  // 从会话存储获取用户信息
  const userData = sessionStorage.getItem('hotel_user')
  // 判断是否已登录（布尔值）
  const isLoggedIn = !!userData
  
  // 权限判断逻辑
  if (to.meta.requiresAuth && !isLoggedIn) {
    // 情况1：访问需要认证的页面但未登录
    // 处理：重定向到登录页面
    next('/Login')
  } else if (to.path.toLowerCase() === '/login' && isLoggedIn) {
    // 情况2：已登录用户访问登录页面
    // 处理：重定向到首页，避免重复登录
    // 注意：路由匹配本身大小写不敏感，但字符串比较敏感，故统一转小写后比较
    next('/Home')
  } else {
    // 情况3：正常访问
    // 处理：允许通过
    next()
  }
})

// 导出路由实例供main.js使用
export default router
