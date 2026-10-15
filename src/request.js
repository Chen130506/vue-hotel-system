/**
 * HTTP请求封装模块 (request.js)
 * 功能：封装Axios实例，提供统一的请求配置
 */
import axios from 'axios'
// 线上演示模式使用的本地数据适配器（用途见该文件头部说明）
import mockAdapter from './api/mockAdapter'

/**
 * 接口地址：
 *   1. 部署平台配置了 VITE_API_BASE 时用该地址（接真实后端）
 *   2. 否则用本地 json-server 的默认地址（npm run server 起在 3000 端口）
 */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

/**
 * 是否启用「线上演示模式」：
 * 生产构建（部署到 Vercel / Netlify 等）且未配置 VITE_API_BASE 时，
 * 说明这是一份没有服务端的纯静态部署，此时改用内置数据 + localStorage，
 * 让访客打开页面即可直接使用。
 * 本地开发（npm run dev，import.meta.env.PROD 为 false）始终走真实的 json-server。
 */
const USE_DEMO_DATA = import.meta.env.PROD && !import.meta.env.VITE_API_BASE

/**
 * 创建Axios实例
 * 配置项说明：
 * - baseURL: API基础地址
 * - timeout: 请求超时时间（毫秒），超时则中断请求
 * - adapter: 仅在演示模式下替换为本地数据实现；组件的调用方式（request.get('/rooms')）完全不变
 */
const request = axios.create({
  baseURL: API_BASE,
  timeout: 3000,
  ...(USE_DEMO_DATA ? { adapter: mockAdapter } : {})
})

// 导出请求实例，供各模块调用
export default request
