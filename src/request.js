/**
 * HTTP请求封装模块 (request.js)
 * 功能：封装Axios实例，提供统一的请求配置和拦截器
 */

// 导入Axios库
import axios from 'axios'

/**
 * 创建Axios实例
 * 配置项说明：
 * - baseURL: API基础地址，指向json-server模拟后端
 * - timeout: 请求超时时间（毫秒），超时则中断请求
 */
const request = axios.create({  
  baseURL: "http://localhost:3000",  
  timeout: 3000
})

// 导出请求实例，供各模块调用
export default request