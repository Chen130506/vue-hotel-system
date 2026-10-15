/**
 * mockAdapter.js —— 线上演示模式的数据层
 *
 * 背景：
 * 本项目本地开发时由 json-server 提供 REST 接口（见 package.json 的 server 脚本）。
 * 但把它作为纯静态站点部署到 Vercel / Netlify 之后，没有服务端可以承载 json-server，
 * 而前端里写死的 http://localhost:3000 会指向**访问者自己的电脑**，请求必然失败。
 *
 * 因此这里实现一个 axios 适配器（adapter），在「生产构建且未配置 VITE_API_BASE」时接管请求：
 *   - 以 db.json 作为初始数据快照（seed）
 *   - 运行时数据写入 localStorage，刷新页面不丢失
 *   - 行为对齐 json-server 的常用 REST 语义：
 *       GET    /资源          列表（支持 ?key=value 精确过滤）
 *       GET    /资源/:id      取单项
 *       POST   /资源          新增（自动补 id）
 *       PATCH  /资源/:id      局部更新（浅合并）
 *       PATCH  /资源          整体替换 / 对象合并
 *       PUT    /资源/:id      整体替换
 *       DELETE /资源/:id      删除
 *
 * 组件代码无需任何改动 —— 它们照常写 request.get('/rooms')，
 * 只是请求不再经过网络，而是落到这里。
 */
import seed from '../../db.json'

const STORAGE_KEY = 'hotel-demo-db'

let db = null

/** 读取运行时数据；首次访问时用 db.json 的快照初始化 */
function loadDb() {
  if (db) return db
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      db = JSON.parse(raw)
      return db
    }
  } catch (error) {
    console.warn('[demo] 读取本地数据失败，已回落到初始数据：', error)
  }
  db = JSON.parse(JSON.stringify(seed))
  return db
}

/** 把当前数据写回 localStorage */
function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (error) {
    console.warn('[demo] 写入本地数据失败（可能是浏览器禁用了存储）：', error)
  }
}

/** 生成一个 4 位十六进制的 id，风格与 json-server 一致 */
function newId(list) {
  const exists = (v) => Array.isArray(list) && list.some((it) => String(it.id) === v)
  let id
  do {
    id = Math.random().toString(16).slice(2, 6).padEnd(4, '0')
  } while (exists(id))
  return id
}

/** 把 "?a=1&b=2" 解析成 { a: '1', b: '2' } */
function parseQuery(url) {
  const i = url.indexOf('?')
  if (i === -1) return {}
  const query = {}
  new URLSearchParams(url.slice(i + 1)).forEach((value, key) => {
    query[key] = value
  })
  return query
}

/** 按查询参数做精确匹配（全部按字符串比较，与 json-server 的行为一致） */
function matchQuery(list, query) {
  const keys = Object.keys(query)
  if (!keys.length) return list
  return list.filter((item) => keys.every((k) => String(item[k]) === String(query[k])))
}

function findByIndex(list, id) {
  return list.findIndex((it) => String(it.id) === String(id))
}

/** 核心：模拟 json-server 对各个 HTTP 方法的处理 */
function handle(method, pathname, query, body) {
  const segs = pathname.replace(/^\/+|\/+$/g, '').split('/')
  const resource = segs[0]
  const id = segs[1]

  if (!resource || !(resource in db)) {
    return { status: 404, data: {} }
  }

  const target = db[resource]
  const isList = Array.isArray(target)

  if (method === 'get') {
    if (id === undefined) {
      return { status: 200, data: isList ? matchQuery(target, query) : target }
    }
    if (isList) {
      const idx = findByIndex(target, id)
      return idx === -1 ? { status: 404, data: {} } : { status: 200, data: target[idx] }
    }
    return { status: 200, data: target }
  }

  if (method === 'post') {
    if (isList) {
      const item = { ...body, id: body.id || newId(target) }
      target.push(item)
      persist()
      return { status: 201, data: item }
    }
    db[resource] = { ...target, ...body }
    persist()
    return { status: 200, data: db[resource] }
  }

  if (method === 'put' || method === 'patch') {
    if (id !== undefined && isList) {
      const idx = findByIndex(target, id)
      if (idx === -1) return { status: 404, data: {} }
      // PUT 整体替换（保留原 id），PATCH 局部合并
      target[idx] = method === 'put'
        ? { ...body, id: target[idx].id }
        : { ...target[idx], ...body }
      persist()
      return { status: 200, data: target[idx] }
    }
    if (id !== undefined) {
      return { status: 404, data: {} }
    }
    // 不带 id：数组整体替换；对象则合并（dailyStats 走的是这一支）
    db[resource] = isList ? body : { ...target, ...body }
    persist()
    return { status: 200, data: db[resource] }
  }

  if (method === 'delete') {
    if (isList && id !== undefined) {
      const idx = findByIndex(target, id)
      if (idx === -1) return { status: 404, data: {} }
      const [removed] = target.splice(idx, 1)
      persist()
      return { status: 200, data: removed }
    }
    return { status: 404, data: {} }
  }

  return { status: 405, data: {} }
}

/**
 * axios 适配器：签名与内置适配器一致，返回与真实响应同构的对象。
 * 非 2xx 时同样以 reject 方式抛出，保证组件里已有的 try/catch 分支照常生效。
 */
export default function mockAdapter(config) {
  return new Promise((resolve, reject) => {
    const method = (config.method || 'get').toLowerCase()
    const url = config.url || ''
    const qIndex = url.indexOf('?')
    const pathname = qIndex === -1 ? url : url.slice(0, qIndex)

    let body = config.data || {}
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (error) {
        body = {}
      }
    }

    loadDb()
    const result = handle(method, pathname, parseQuery(url), body)

    const response = {
      data: result.data,
      status: result.status,
      statusText: result.status < 300 ? 'OK' : 'Error',
      headers: { 'content-type': 'application/json' },
      config,
      request: {}
    }

    if (result.status >= 200 && result.status < 300) {
      resolve(response)
    } else {
      const error = new Error('Request failed with status code ' + result.status)
      error.response = response
      error.config = config
      reject(error)
    }
  })
}
