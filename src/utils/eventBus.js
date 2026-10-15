/**
 * 全局事件总线 - 用于组件间通信
 * 解决数据变更实时同步问题
 */

import { onUnmounted } from 'vue'

class EventBus {
  constructor() {
    this.events = {}
  }

  // 监听事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
    
    // 返回取消监听函数
    return () => {
      this.off(event, callback)
    }
  }

  // 取消监听
  off(event, callback) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  // 触发事件
  emit(event, ...args) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => {
      try {
        callback(...args)
      } catch (error) {
        console.error(`EventBus error in event "${event}":`, error)
      }
    })
  }

  // 一次性监听
  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// Vue Composition API 钩子
export function useEventBus() {
  const listeners = []

  // 自动清理的监听器
  function onEvent(event, callback) {
    const unsubscribe = eventBus.on(event, callback)
    listeners.push(unsubscribe)
  }

  // 组件卸载时自动清理监听器
  onUnmounted(() => {
    listeners.forEach(unsubscribe => unsubscribe())
  })

  return {
    on: onEvent,
    emit: eventBus.emit.bind(eventBus)
  }
}

// 事件类型常量
export const EVENTS = {
  ROOMS_UPDATED: 'rooms-updated',
  BOOKINGS_UPDATED: 'bookings-updated',
  CHECK_IN_UPDATED: 'check-in-updated',
  CHECK_OUT_UPDATED: 'check-out-updated'
}

export default eventBus
