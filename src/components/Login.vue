<!--
  登录组件 (Login.vue)
  
  功能概述：
  1. 提供用户身份验证功能
  2. 支持用户名/密码登录
  3. 表单验证和数据提交
  4. 登录状态管理和路由跳转
  5. 提供注册页面入口
  
  技术实现：
  - 使用Element Plus表单组件
  - 使用Composition API
  - Axios进行后端验证
  - sessionStorage存储登录状态
  - 路由守卫控制访问权限
-->

<!--
 * Login.vue - 酒店管理系统登录组件
 * 
 * 功能概述：
 * - 用户身份验证和登录
 * - 表单验证和错误处理
 * - 与后端API进行用户认证
 * - 登录成功后跳转到主页
 * - 支持从注册页面自动填充用户名
 * 
 * 组件特性：
 * - 响应式表单设计
 * - 实时表单验证
 * - 安全的输入处理
 * - 移动端适配
 * - 加载状态指示
 -->

<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 标题区域 -->
      <div class="login-header">
        <h1>橘子酒店管理系统</h1>
        <p>Orange Hotel Management System</p>
      </div>
      
      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <!-- 用户名输入 -->
        <el-form-item prop="username">
          <div class="form-label">用户名：</div>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            clearable
          />
        </el-form-item>
        
        <!-- 密码输入 -->
        <el-form-item prop="password">
          <div class="form-label">密码：</div>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <!-- 按钮区域 -->
        <div class="form-buttons">
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
          <el-button
            size="large"
            class="register-btn"
            @click="goToRegister"
          >
            注册账号
          </el-button>
        </div>
      </el-form>
      
      <!-- 底部信息 -->
      <div class="login-footer">
        <p>© 2026 橘子酒店管理系统 v1.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import request from '../request'
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
// 路由相关实例
const router = useRouter()        // 路由导航实例
const route = useRoute()          // 当前路由信息

// 表单和状态引用
const loginFormRef = ref()        // 表单引用，用于调用验证方法
const loading = ref(false)        // 登录加载状态

/**
 * 组件挂载时的生命周期钩子
 * 检查路由参数中是否有注册成功传递的用户名
 */
onMounted(() => {
  if (route.query.registeredUsername) {
    loginForm.username = route.query.registeredUsername
    ElMessage.success('注册成功！用户名已自动填充')
  }
})

// 登录表单数据 - 使用reactive实现响应式对象
const loginForm = reactive({
  username: '',  // 用户名输入
  password: ''   // 密码输入
})

// 表单验证规则配置
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, message: '用户名至少1个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位数字', trigger: 'blur' },
    { pattern: /^\d{6,}$/, message: '密码必须是6位或以上数字', trigger: 'blur' }
  ]
}

/**
 * 处理登录逻辑
 * 执行表单验证、用户认证、状态更新和页面跳转
 */
const handleLogin = async () => {
  if (!loginFormRef.value) return

  // validate() 校验失败时是 reject（拒绝值是按字段分组的错误对象），不会返回 false。
  // 必须单独捕获，否则会抛出未处理的 Promise 拒绝，且下面的 return 永远执行不到
  let valid = false
  try {
    valid = await loginFormRef.value.validate()
  } catch {
    valid = false
  }
  if (!valid) return  // 表单验证失败则停止执行
  
  loading.value = true  // 开始加载状态
  
  try {
    // 从API查询用户信息
    const response = await request.get('/users', {
      params: {
        username: loginForm.username
      }
    })
    
    const users = response.data
    
    // 检查用户是否存在
    if (users.length === 0) {
      ElMessage.error('用户不存在')
      return
    }
    
    const user = users[0]
    
    // 验证密码
    if (user.password !== loginForm.password) {
      ElMessage.error('密码错误')
      return
    }
    
    console.log('登录成功:', user.username)
    
    // 更新db.json中的登录状态（可选操作）
    try {
      await request.patch(`/users/${user.id}`, {
        isLogin: true
      })
    } catch (error) {
      console.log('更新db.json登录状态失败，但继续执行登录流程')
    }
    
    // 存储登录状态到sessionStorage
    sessionStorage.setItem('hotel_token', 'token_' + Date.now())
    sessionStorage.setItem('hotel_user', JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role || '用户',  // 添加角色字段，默认为"用户"
      loginTime: new Date().toLocaleString()
    }))
    
    ElMessage.success('登录成功，正在跳转...')
    
    // 延迟跳转以显示成功消息
    setTimeout(() => {
      router.push('/Home')
    }, 500)
    
  } catch (error) {
    console.error('登录错误:', error)
    // 根据错误类型显示不同的错误消息
    if (error.response) {
      ElMessage.error(`登录失败: ${error.response.status} ${error.response.statusText}`)
    } else if (error.request) {
      ElMessage.error('无法连接到服务器，请检查 json-server 是否已启动')
    } else {
      ElMessage.error('登录失败，请稍后重试')
    }
  } finally {
    loading.value = false  // 结束加载状态
  }
}

/**
 * 跳转到注册页面
 */
const goToRegister = () => {
  router.push('/Register')
}
</script>

<style scoped>
/* 登录页面容器样式 */
.login-container {
  min-height: 100vh;  /* 至少占据整个视口高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  /* 背景装饰渐变效果 */
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(91, 173, 254, 0.1) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(91, 173, 254, 0.1) 0%, transparent 20%);
}

/* 登录框样式 */
.login-box {
  width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);  /* 卡片阴影 */
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.login-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.login-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
  letter-spacing: 1px;
}

.login-form {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-label::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

:deep(.el-input) {
  --el-input-border-color: #dcdfe6;
  --el-input-hover-border-color: #c0c4cc;
  --el-input-focus-border-color: #409eff;
}

:deep(.el-input__inner) {
  border-radius: 4px;
}

.form-buttons {
  display: flex;
  gap: 20px;
  margin-top: 30px;
}

.login-btn {
  flex: 1;
  background: #409eff;
  border-color: #409eff;
  height: 40px;
  font-size: 16px;
}

.login-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.register-btn {
  flex: 1;
  height: 40px;
  font-size: 16px;
  color: #606266;
  border-color: #dcdfe6;
}

.register-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.login-footer p {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

@media (max-width: 480px) {
  .login-container {
    padding: 20px;
  }
  
  .login-box {
    width: 100%;
    padding: 30px 20px;
  }
  
  .form-buttons {
    flex-direction: column;
    gap: 15px;
  }
  
  .login-btn,
  .register-btn {
    width: 100%;
  }
}
</style>