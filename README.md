# 酒店住房管理系统（Vue 3 + Element Plus + json-server）

面向酒店前台日常业务的管理后台，覆盖 **登录鉴权 → 房态中心 → 预订管理 → 入住 / 退房办理 → 数据报表** 的完整流程。

个人实践项目，独立完成。

---

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端框架 | Vue 3（`<script setup>` 组合式 API） |
| UI 组件库 | Element Plus 2.13 + `@element-plus/icons-vue` |
| 路由 | Vue Router 4（Hash 模式 + 嵌套路由 + 命名视图 + 路由懒加载） |
| 通信与状态 | sessionStorage + 自定义 eventBus |
| 数据请求 | Axios（统一实例封装，baseURL / timeout / 拦截器） |
| 数据可视化 | ECharts 6（饼图 + 折线图） |
| 构建工具 | Vite 7 |
| 模拟后端 | json-server 1.0（提供 RESTful 接口） |

---

## 快速开始

需要 Node.js 18+，开 **两个终端**：

```bash
# 终端 1：启动模拟后端（端口 3000，与 src/request.js 里的 baseURL 保持一致）
npm run server        # 等价于 npx json-server db.json --port 3000

# 终端 2：启动前端开发服务器
npm install
npm run dev
```

浏览器打开终端 2 输出的地址（默认 `http://localhost:5173`），使用 `db.json` 中 `users` 里的账号登录（例如 `admin` / `123456`）。

其他命令：

```bash
npm run build     # 打包到 dist/
npm run preview   # 本地预览打包结果
```

> **端口只在一处配置**：`src/request.js` 的 `baseURL`。所有业务组件都通过它导出的 `request` 实例发请求（形如 `request.get('/rooms')`），没有第二处硬编码地址。改后端地址时只改这一个文件即可。

> `db.json` 既是 json-server 的数据源，也是被 json-server 就地写入的存储，因此增删改数据会直接反映到该文件。修改前建议先备份。

---

## 部署说明

本项目自带一个 json-server 模拟后端，本地开发时需要额外起一个 Node 进程。
为了让它能作为**纯静态站点**部署（Vercel / Netlify / GitHub Pages 均可），`src/request.js` 做了一层切换：

| 场景 | 数据来源 |
| --- | --- |
| 本地开发 `npm run dev` | `http://localhost:3000`，即 json-server（真实 HTTP 请求） |
| `npm run build` 后部署到静态托管 | 未配置 `VITE_API_BASE` 时，自动切到内置数据源：以 `db.json` 为初始快照，数据写入 localStorage，刷新不丢失 |

也就是说，**部署到静态托管后访客打开即可直接使用，不需要任何服务端**。演示数据保存在访客自己的浏览器里，想恢复初始状态清一下该站点的本地存储即可。

如果之后接了真实后端，只要在部署平台配置环境变量 `VITE_API_BASE=https://你的后端地址`，就会自动改回走真实 HTTP 请求，**前端业务代码一行都不用改**。

> 路由使用 Hash 模式（`#/Home/...`），因此静态托管无需配置任何 URL 重写规则。

---

## 功能模块

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 登录 | `/Login` | 账号密码校验，写入 sessionStorage |
| 注册 | `/Register` | 新用户注册，写入 users 表 |
| 仪表盘 | `/Home` | 系统概览 |
| 房态中心 | `/Home/room-status` | 40 间客房状态可视化，支持多条件筛选 |
| 房间详情 | `/Home/room-detail/:id` | 动态路由，查看单个房间完整信息 |
| 预订管理 | `/Home/booking` | 预订记录的增删改查与状态筛选 |
| 住房管理 | `/Home/housing` | 已入住客人列表 |
| 办理入住 | `/Home/checkin` | 选择房间 + 填写客人信息 |
| 办理退房 | `/Home/checkout` | 确认退房并释放房间 |

### 房态五态

房间不只有「空 / 满」两种状态，实际业务中同时存在五种，`db.json` 中对应四个布尔字段与一个占用标记：

| 状态 | 判定字段 |
| --- | --- |
| 已入住 | `isOccupied = true` |
| 空闲 | 四个标记均为 false |
| 待清洁 | `isCleaned = false` |
| 需维修 | `needsMaintenance = true` |
| 已预订 | `isBooked = true` |

页面按状态分色渲染，便于前台一眼识别。

### 预订状态流转

`booked.status` 按业务顺序流转：

```
未入住 ──→ 已入住 ──→ 已完成
   └──→ 已取消
```

---

## 数据模型（db.json）

| 集合 | 条数 | 主要字段 |
| --- | --- | --- |
| `rooms` | 40 | `number` `type` `typeName` `isOccupied` `guestInfo` `isCleaned` `needsMaintenance` `isBooked` `checkoutTime` |
| `users` | 5 | `username` `password` `email` `phone` `registerTime` `role` `status` `isLogin` |
| `booked` | 2 | `name` `phone` `bookroom` `checkInTime` `checkOutTime` `status` `remarks` `booktime`；办理入住 / 退房后追加 `actualCheckInTime` `actualCheckOutTime` |
| `dailyStats` | — | 近 7 天入住 / 退房趋势数据，供 ECharts 折线图使用 |

---

## 目录结构

```
src/
├── main.js                  # 应用入口，注册 Element Plus 与路由
├── App.vue                  # 根组件
├── router.js                # 路由表 + 全局前置守卫
├── request.js               # Axios 实例封装（本地开发走 json-server，生产构建走内置数据源）
├── style.css
├── api/
│   └── mockAdapter.js       # 线上演示模式的数据层：内置数据 + localStorage，无需服务端
├── utils/
│   ├── eventBus.js          # 跨组件事件总线
│   ├── bookingSync.js       # 预订记录 ↔ 房间状态联动（入住 / 退房回写预订状态）
│   └── date.js              # 本地日期工具（避免 UTC 造成的差一天）
└── components/
    ├── Home.vue             # 需鉴权的父级布局容器
    ├── Login.vue / Register.vue
    ├── Aside.vue            # 侧边栏（含各模块子菜单）
    ├── Header.vue           # 顶栏
    ├── Main.vue             # 默认主内容区（仪表盘）
    ├── Aside/               # 各业务模块的侧边菜单
    └── Main/                # 各业务模块的主内容区
        ├── room-center.vue
        ├── room-detail.vue
        ├── booking.vue
        ├── housing-home.vue
        ├── checkin-page.vue
        └── checkout-page.vue
```

---

## 几个实现要点

1. **嵌套路由 + 命名视图做三栏布局。** `Home.vue` 作为父级容器，7 个子路由共用 `<router-view name="Aside" />`、`<router-view name="Header" />`、`<router-view name="Main" />` 三个命名视图，切换业务页时侧边栏与顶栏不重新渲染。

2. **路由懒加载。** 所有业务组件均以 `() => import(...)` 动态引入，首屏只加载登录页，其余按需分包。

3. **全局前置守卫做鉴权。** `router.beforeEach` 读取 `sessionStorage` 中的 `hotel_user`，配合路由 `meta.requiresAuth` 拦截未登录访问；已登录用户再访问 `/login` 会被重定向回首页。

4. **Axios 统一封装。** `request.js` 集中管理 `baseURL` 与 `timeout`，所有组件统一通过 `request` 实例访问接口（`request.get('/rooms')`），业务代码里不出现完整地址，替换真实后端时只改一处。

5. **ECharts 数据可视化。** 仪表盘用饼图展示房型分布，用折线图展示近 7 天入住 / 退房趋势。

6. **预订状态机闭环。** 预订、入住、退房三个入口都会更新 `booked.status`：新建预订写「未入住」，办理入住写「已入住」，办理退房写「已完成」，取消预订写「已取消」，并由 `utils/bookingSync.js` 统一封装查询与回写逻辑，避免同一段联动代码在多个组件里各写一份。实际办理时刻另存为 `actualCheckInTime` / `actualCheckOutTime`，不覆盖预订时填写的计划日期。

---

## 已知不足与后续改进

- **后端是模拟的。** json-server 直接读写 `db.json`，没有真正的服务端逻辑与数据库。后续计划用 Node.js / Express（或 Spring Boot）+ MySQL 重写接口层，并把 Axios 的 `baseURL` 指向真实服务。
- **鉴权只在前端。** 目前用 sessionStorage 标记登录态，属于前端路由级控制，绕过浏览器存储即可访问页面。真实场景应由服务端签发 JWT 并校验。
- **未做预订时间冲突校验。** 房间的可订性只判断当前 `isBooked` 标记，没有按 `checkInTime` / `checkOutTime` 区间判断，因此同一房间不同日期段无法重复预订；同一房间存在多条待处理预订时，入住按插入顺序取最早一条。
- **密码明文存储。** 模拟数据直接存明文，真实系统必须加盐哈希。

---

## 运行截图

> 建议放入 `screenshots/` 目录并在下方引用，例如：
> `![房态中心](screenshots/room-status.png)`

- 登录页
- 房态中心（五态分色）
- 预订管理
- 仪表盘报表

---

## 组件功能说明

详细的功能点拆解见 [`docs/COMPONENTS_FUNCTIONAL_SPEC.md`](docs/COMPONENTS_FUNCTIONAL_SPEC.md)。
