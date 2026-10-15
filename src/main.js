/**
 * 应用入口文件
 * 功能：初始化Vue应用、配置全局组件和插件
 */

// 导入Vue核心模块
import { createApp } from 'vue'

// 导入全局样式
import './style.css'

// 导入根组件
import App from './App.vue'

// 创建Vue应用实例
const app = createApp(App)

/**
 * Element Plus UI组件库配置
 * 包含：完整组件库、中文语言包、全部图标组件
 */

// 导入Element Plus主模块
import ElementPlus from 'element-plus'

// 导入中文语言包（提供中文界面和错误提示）
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 导入Element Plus样式文件
import 'element-plus/dist/index.css'

/**
 * 全局注册所有Element Plus图标组件
 * 遍历所有图标并注册为全局组件，可在任何模板中直接使用
 * 例如：<el-icon><Plus /></el-icon>
 */
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
   app.component(key, component)
}

// 配置Element Plus并启用中文支持
app.use(ElementPlus, { locale: zhCn,})

/**
 * 路由配置
 * 导入并注册路由实例，实现页面导航功能
 */
import router from './router.js'
app.use(router)

/**
 * 挂载应用
 * 将Vue应用挂载到index.html中的#app元素
 */
app.mount("#app")