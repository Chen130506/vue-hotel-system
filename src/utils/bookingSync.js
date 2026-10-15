/**
 * bookingSync.js - 预订记录（booked）与房间状态（rooms）的联动工具
 *
 * 为什么需要单独封装：
 * 预订、入住、退房三处操作各自维护 rooms 数据，但 booked 记录的状态此前只在
 * 「预订管理」页里被更新，另外两个入口没有回写，导致状态机走不通：
 *   1) 从「办理入住」页直接给某个已被预订的房间办入住后，预订记录仍停留在「未入住」，
 *      「已入住」与「已取消」之外的记录无法反映真实情况；
 *   2) 退房没有任何入口更新预订记录，因此「已完成」状态永远不会出现。
 * 把这两条联动逻辑收敛到本模块，供 checkin-page / checkout-page 复用，
 * 同时也让「预订 → 入住 → 退房」形成完整闭环。
 */
import request from '../request'
import { toLocalDateTimeStr } from './date'

/**
 * 按房间号查询预订记录
 * @param {string} roomNumber 房间号（对应 booked.bookroom）
 * @param {string} [status] 可选，进一步限定预订状态（如「未入住」「已入住」）
 * @returns {Promise<Array>} 命中的预订记录数组，查询异常时返回空数组
 */
export const findBookingsByRoom = async (roomNumber, status) => {
  if (!roomNumber) return []
  try {
    const response = await request.get(`/booked?bookroom=${roomNumber}`)
    const list = response.data || []
    return status ? list.filter(item => item.status === status) : list
  } catch (error) {
    console.error('查询预订记录失败:', error)
    return []
  }
}

/**
 * 办理入住时回写预订记录：把该房间「未入住」的预订置为「已入住」
 * json-server 按插入顺序返回数组，故取第一条即该房间最早创建的预订（先订先住）
 * @param {string} roomNumber 房间号
 * @param {{name?: string, contact?: string}} guest 实际入住人信息
 * @param {string} [time] 实际入住时间（本地时间字符串）
 * @returns {Promise<Object|null>} 被更新的预订记录；该房间没有待入住预订时返回 null
 */
export const markBookingCheckedIn = async (roomNumber, guest, time) => {
  const pending = await findBookingsByRoom(roomNumber, '未入住')
  if (!pending.length) return null

  const target = pending[0]
  const updated = {
    ...target,
    status: '已入住',
    // 实际入住人以办理入住时填写的信息为准，回写后预订表与住房管理的入住人保持一致
    name: guest?.name || target.name,
    phone: guest?.contact || target.phone,
    // 计划入住日期是 checkInTime，这里另存实际办理时刻，避免覆盖预订时的计划值
    actualCheckInTime: time || toLocalDateTimeStr()
  }
  await request.patch(`/booked/${target.id}`, updated)
  return updated
}

/**
 * 办理退房时回写预订记录：把该房间「已入住」的预订置为「已完成」
 * @param {string} roomNumber 房间号
 * @param {string} [time] 实际退房时间（本地时间字符串）
 * @returns {Promise<Object|null>} 被更新的预订记录；该房间没有在住预订时返回 null
 */
export const markBookingCompleted = async (roomNumber, time) => {
  const living = await findBookingsByRoom(roomNumber, '已入住')
  if (!living.length) return null

  const target = living[0]
  const updated = {
    ...target,
    status: '已完成',
    // 计划离店日期是 checkOutTime，这里另存实际退房时刻，避免覆盖预订时的计划值
    actualCheckOutTime: time || toLocalDateTimeStr()
  }
  await request.patch(`/booked/${target.id}`, updated)
  return updated
}
