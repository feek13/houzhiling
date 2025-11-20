export const roadmapItems = [
  {
    id: 'auth-system',
    title: '用户体系',
    status: 'progress',
    description:
      '注册/登录、密码强度、忘记密码入口、登录态守护，以及未来角色/三方登录扩展，满足 Fitness app 对个性化与同步的需求。',
    tasks: [
      { id: 'auth-forms', label: '响应式登录/注册 UI 与即时校验', done: true },
      { id: 'auth-strength', label: '密码强度检测 + 重复邮箱提示', done: true },
      { id: 'auth-forgot', label: '忘记密码流程占位、邮件/短信预留', done: true },
      { id: 'auth-session', label: '登录态守护、CSRF/速率策略', done: true },
      { id: 'auth-roles', label: '角色/第三方登录扩展点设计', done: false },
    ],
  },
  {
    id: 'profile-bmi',
    title: '个人资料 & 身体数据',
    status: 'done',
    description:
      '新增身高体重、BMI、体脂估算、目标体重、患病史等字段，记录历史并输出折线图，对接提醒与合规提示。',
    tasks: [
      { id: 'profile-fields', label: '扩展表单字段（身高/体重/年龄/性别/偏好/病史）', done: true },
      { id: 'profile-bmi-calc', label: 'BMI/体脂计算与区间提示文案', done: true },
      { id: 'profile-history', label: '度量历史存储 + Chart.js 折线图', done: true },
      { id: 'profile-reminders', label: '周目标/提醒与告警（高风险提示）', done: true },
    ],
  },
  {
    id: 'workout-library',
    title: '课程与训练库',
    status: 'progress',
    description:
      '多维筛选（部位、器械、时长、难度），教程详情（视频、图文、动作要点）与周计划生成器，支持按用户目标推荐。',
    tasks: [
      { id: 'workout-filters', label: '多条件过滤与搜索（部位/器械/时长/难度）', done: true },
      { id: 'workout-detail', label: '教程详情页（视频/图文/风险提醒）', done: true },
      { id: 'workout-plan', label: '周计划生成器 + 计划看板', done: true },
      { id: 'workout-goal-sync', label: '结合用户目标的个性化推荐', done: false },
    ],
  },
  {
    id: 'nutrition-log',
    title: '营养与日志',
    status: 'progress',
    description:
      '记录热量与宏量素，引入饮食模板、扫码/手动录入，与训练日志联动，实现 calorie counter + goal tracking。',
    tasks: [
      { id: 'nutrition-macros', label: '宏量素（蛋白/脂肪/碳水）录入与统计', done: true },
      { id: 'nutrition-templates', label: '菜谱/餐单模板与复制逻辑', done: true },
      { id: 'nutrition-scan', label: '扫码/手动录入组件（可对接 API）', done: true },
      { id: 'nutrition-sync', label: '与训练日志、消耗数据联动显示', done: false },
    ],
  },
  {
    id: 'engagement',
    title: '进阶追踪与互动',
    status: 'progress',
    description:
      '构建目标完成率、勋章、连续签到、好友鼓励等游戏化元素，预留穿戴设备/心率 API 与排行榜。',
    tasks: [
      { id: 'engage-goals', label: '目标设置 + 完成率仪表', done: true },
      { id: 'engage-badges', label: '勋章、连续签到、分享海报', done: true },
      { id: 'engage-social', label: '好友鼓励/轻社交互动', done: true },
      { id: 'engage-wearable', label: '穿戴设备/心率 API 同步占位', done: false },
    ],
  },
  {
    id: 'content-services',
    title: '内容与服务',
    status: 'done',
    description:
      '上线知识文章、FAQ、预约教练或咨询表单，预留 AI 轻教练接口（WHO/ACSM 指南）与消息中心。',
    tasks: [
      { id: 'content-articles', label: '知识库/FAQ 模块、伤害预防内容', done: true },
      { id: 'content-coach', label: '预约/咨询表单 + 通知', done: true },
      { id: 'content-ai', label: 'AI 轻教练接口占位，基于指南推文案', done: true },
      { id: 'content-messages', label: '站内消息/通知中心', done: true },
    ],
  },
  {
    id: 'tech-management',
    title: '管理 / 技术',
    status: 'pending',
    description:
      '模块化 JS、组件化 UI、可配置数据源（localStorage → REST），并配套自动化测试与部署流水线。',
    tasks: [
      { id: 'tech-architecture', label: '事件总线或轻量 store + API 适配层', done: false },
      { id: 'tech-modules', label: '组件化 UI/模块封装（auth/profile/workout 等）', done: false },
      { id: 'tech-tests', label: 'BMI 计算、日志处理、权限守卫等自动化测试', done: false },
      { id: 'tech-deploy', label: 'Lighthouse、自测脚本与部署流水线', done: false },
    ],
  },
];
