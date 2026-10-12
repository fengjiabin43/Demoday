# 技术栈与前后端边界

日期：2026-10-12。本次交付完整前端模拟体验，遵循 PRD 和 DEV_HANDOFF，不实现真实后端。

## 当前前端

React 19 + TypeScript 5 + Vite 7 开发服务，生产版通过 esbuild 打包。Hash 路由支持直接进入具体视频、题目、判断卡；同一 React 根状态驱动所有页面。生产构建采用独立脚本，避开本机 Vite / Rollup 打包进程异常退出；仍使用相同源码、类型检查和静态资源。

`MockLearningAPI.transaction` 先复制状态，执行确定性操作，写入 localStorage 成功后才发布新状态。保存失败不发布已通过题目或奖励，界面保留输入并提供重试、备份入口。每题通过奖励以题目标识去重，事件以 eventId 去重。

领域内容与个人记忆分开：`content.ts` 存放只读知识骨架、关系、题库和来源；`engine.ts` 存放个人目标、进度、证据、奖励账本、对话、工作卡和时间统计。用户自述不修改内容库，也不替代验证证据。

录像进度每两秒以及暂停、拖动结束、离开、页面隐藏时保存；实际观看覆盖来自浏览器 `video.played` 区间并集，不用播放位置推算观看完成。图文阅读单独记事件。视频是实际编码的原创 MP4，不是封面模拟。

页面包含学习、视频、关卡、工作台、搭子、判断卡；底部管理面板包含领养、上下文帮助、来源、知识详情、记忆、成长、更新和清除确认。360px 使用手机知识列表，桌面使用关系网络，数据来源相同。

## 后端规划

NestJS + PostgreSQL，保持 TypeScript 领域操作契约。后续可把 MockLearningAPI 替换为 HTTP 适配器。API 规划如下，当前均由本地模块执行，没有假装向服务器发送请求。

| 接口 | 当前本地操作 | 后端约束 |
| --- | --- | --- |
| GET /next-tasks | getNextTasks | 用户排序优先，每次最多三个 |
| PUT /playback/:lessonId | savePlayback | 合并实际区间，保存断点 |
| POST /challenges/:id/submissions | submitChallenge | eventId 幂等；数据库事务更新证据、奖励和视图 |
| GET /knowledge | getKnowledgeView | 仅从有效引用与真实证据派生 |
| PATCH /preferences | updatePreference | 保存用户明确偏好，重排未来任务 |
| DELETE /memories/:id | removeMemory | 删除依赖证据，保留必要去重账本 |
| POST /application-cards | createApplicationCard / saveCard | 保存场景、来源、待确认与修改历史 |
| GET /learning-export | exportLearningData | 导出当前用户记录，不新增奖励 |

建议表：users、profiles、learning_events、evidence、rewards、resume_states、plan_adjustments、application_cards、application_revisions、conversation_rounds。rewards 对 user_id + challenge_id 建唯一约束，learning_events 对 user_id + event_id 建唯一约束。

模型代理以后放在后端，凭据不放前端；模型只生成解释，不直接修改经验、领域关系或题目判定。本次帮助、整理、规划和判断卡均使用可审查的内容或规则。

## 当前没有实现

真实账户、服务器持久化、跨设备同步、开放模型与实时抓取；这些不影响前端验收路径。素材无配音；具备动画、原生播放控件、可切换字幕、封面与来源。
