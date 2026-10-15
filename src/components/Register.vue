<!--
 * Register.vue - 酒店管理系统用户注册组件
 * 
 * 功能概述：
 * - 新用户账号注册
 * - 表单验证（用户名唯一性、密码一致性、邮箱格式、手机号格式）
 * - 与后端API进行用户数据保存
 * - 注册成功后跳转到登录页面并填充用户名
 * 
 * 组件特性：
 * - 完整的表单验证规则
 * - 实时的异步用户名验证
 * - 密码强度要求
 * - 响应式表单设计
 * - 移动端适配
 -->

<template>
  <div class="register-container">
    <div class="register-box">
      <!-- 标题区域 -->
      <div class="register-header">
        <h1>用户注册</h1>
        <p>创建您的橘子酒店管理系统账号</p>
      </div>
      
      <!-- 返回登录按钮 -->
      <div class="back-to-login">
        <el-button 
          type="text" 
          @click="goToLogin"
          icon="ArrowLeft"
        >
          返回登录
        </el-button>
      </div>
      
      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegisterSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            clearable
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入6位或以上数字密码"
            show-password
            clearable
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            clearable
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            clearable
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入11位手机号"
            clearable
            maxlength="11"
            size="large"
          />
        </el-form-item>
        
        <!-- 按钮区域 -->
        <div class="form-buttons">
          <el-button
            type="primary"
            size="large"
            class="register-submit-btn"
            :loading="loading"
            @click="handleRegisterSubmit"
          >
            注册
          </el-button>
          <el-button
            size="large"
            class="reset-btn"
            @click="handleReset"
          >
            重置
          </el-button>
        </div>
      </el-form>
      
      <!-- 底部信息 -->
      <div class="register-footer">
        <p>© 2026 橘子酒店管理系统 v1.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import request from '../request'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// 路由实例 - 用于页面导航
const router = useRouter()

// 表单和状态引用
const registerFormRef = ref()          // 表单引用，用于调用验证方法
const loading = ref(false)             // 注册加载状态

// 注册表单数据 - 使用reactive实现响应式对象
const registerForm = reactive({
  username: '',         // 用户名输入
  password: '',         // 密码输入
  confirmPassword: '',  // 确认密码输入
  email: '',            // 邮箱输入
  phone: ''             // 手机号输入
})

// 表单验证规则配置
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, message: '用户名至少1个字符', trigger: 'blur' },
    { max: 20, message: '用户名最多20个字符', trigger: 'blur' },
    {
      // 异步验证用户名唯一性
      validator: async (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        try {
          // 查询数据库中是否已存在相同用户名
          const response = await request.get('/users?username=' + value)
          if (response.data.length > 0) {
            callback(new Error('用户名已存在'))
          } else {
            callback()  // 验证通过
          }
        } catch (error) {
          console.error('检查用户名时出错:', error)
          callback(new Error('检查用户名失败，请稍后重试'))
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位数字', trigger: 'blur' },
    { pattern: /^\d{6,}$/, message: '密码必须是6位或以上数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      // 自定义验证器：检查两次密码输入是否一致
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()  // 验证通过
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入正确的邮箱格式',
      trigger: ['blur', 'change']
    }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^\d{11}$/,  // 验证11位数字手机号格式
      message: '请输入11位数字手机号',
      trigger: 'blur'
    }
  ]
}

/**
 * 处理注册提交逻辑
 * 执行表单验证、用户数据保存、成功跳转
 */
const handleRegisterSubmit = async () => {
  if (!registerFormRef.value) return
  
  // validate() 校验失败时是 reject（拒绝值是按字段分组的错误对象），不会返回 false。
  // 必须单独捕获，否则会抛出未处理的 Promise 拒绝，且下面的 return 永远执行不到
  let valid = false
  try {
    valid = await registerFormRef.value.validate()
  } catch {
    valid = false
  }
  if (!valid) return  // 表单验证失败则停止执行
  
  loading.value = true  // 开始加载状态
  
  try {
    // 获取现有用户列表以确定下一个ID
    const usersResponse = await request.get('/users')
    const users = usersResponse.data || []
    
    // 计算下一个用户ID：找出最大的数字ID并加1
    let nextId = 1
    if (users.length > 0) {
      const numericIds = users
        .map(user => parseInt(user.id))
        .filter(id => !isNaN(id)) // 只保留数字ID
      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0
      nextId = maxId + 1
    }
    
    // 发送 POST 请求创建新用户
    const response = await request.post('/users', {
      id: nextId.toString(),      // 确保ID是字符串类型
      username: registerForm.username,
      password: registerForm.password,
      email: registerForm.email,
      phone: registerForm.phone,
      registerTime: new Date().toLocaleString(),  // 注册时间
      role: 'user',               // 默认用户角色
      status: 'active'            // 默认活跃状态
    })
    
    console.log('注册成功:', response.data)
    
    ElMessage.success('注册成功！正在跳转到登录页面...')
    
    // 延迟跳转，让用户看到成功消息，并传递用户名到登录页面
    setTimeout(() => {
      router.push({
        path: '/login',
        query: { registeredUsername: registerForm.username }
      })
    }, 1000)
    
  } catch (error) {
    console.error('注册错误:', error)
    // 根据错误类型显示不同的错误消息
    if (error.response) {
      ElMessage.error(`注册失败: ${error.response.status} ${error.response.statusText}`)
    } else if (error.request) {
      ElMessage.error('无法连接到服务器，请检查 json-server 是否已启动')
    } else {
      ElMessage.error('注册失败，请稍后重试')
    }
  } finally {
    loading.value = false  // 结束加载状态
  }
}

/**
 * 重置表单字段
 * 清空所有输入框内容
 */
const handleReset = () => {
  if (registerFormRef.value) {
    registerFormRef.value.resetFields()
  }
}

/**
 * 跳转到登录页面
 */
const goToLogin = () => {
  router.push('/Login')
}
</script>

<style scoped>
/* 注册页面容器样式 */
.register-container {
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

/* 注册框样式 */
.register-box {
  width: 450px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);  /* 卡片阴影 */
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.register-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.register-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.back-to-login {
  margin-bottom: 30px;
}

.register-form {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-form-item__label)::before {
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
  margin-top: 40px;
}

.register-submit-btn {
  flex: 1;
  background: #409eff;
  border-color: #409eff;
  height: 40px;
  font-size: 16px;
}

.register-submit-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.reset-btn {
  flex: 1;
  height: 40px;
  font-size: 16px;
  color: #606266;
  border-color: #dcdfe6;
}

.reset-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.register-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  margin-top: 20px;
}

.register-footer p {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

@media (max-width: 500px) {
  .register-container {
    padding: 20px;
  }
  
  .register-box {
    width: 100%;
    padding: 30px 20px;
  }
  
  .form-buttons {
    flex-direction: column;
    gap: 15px;
  }
  
  .register-submit-btn,
  .reset-btn {
    width: 100%;
  }
}
</style>