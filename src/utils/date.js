/**
 * 本地日期工具
 *
 * 为什么需要单独封装：
 * 不能用 `new Date().toISOString().split('T')[0]` 取"今天"——toISOString() 返回的是 UTC 时间，
 * 在东八区（UTC+8）的 00:00–07:59 之间，UTC 日期还停留在"昨天"，
 * 会导致"今日入住/退房"统计被记到错误的一天，图表标签与数据也会错位。
 */

/** Date -> 本地时区的 YYYY-MM-DD */
export function toLocalDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** 今天的本地日期 YYYY-MM-DD */
export function todayStr() {
  return toLocalDateStr(new Date())
}

/**
 * 相对今天偏移 days 天的本地日期（days 为负数表示过去）
 * 用 new Date(y, m, d) 构造可以避开"跨月/跨年"和夏令时带来的天数误差
 */
export function dateStrOffset(days, base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  d.setDate(d.getDate() + days)
  return toLocalDateStr(d)
}

/** 从 ISO 字符串中取出日期部分（YYYY-MM-DD）；入参已是 YYYY-MM-DD 时原样返回 */
export function isoDatePart(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

/** 本地日期字符串 -> 用于图表 X 轴的 M/D 短标签 */
export function toShortLabel(dateStr) {
  const parts = String(dateStr).split('-')
  if (parts.length < 3) return dateStr
  return `${Number(parts[1])}/${Number(parts[2])}`
}

/**
 * 当前的本地日期时间字符串（YYYY-MM-DD HH:mm:ss）
 * 需要"现在"作为默认值时使用它，而不是 toISOString()——
 * 后者是 UTC 时间，与页面其余使用本地日期的逻辑不一致
 */
export function toLocalDateTimeStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
