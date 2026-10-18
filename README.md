# 识光 · AI 学习搭子

按 [PRD](docs/PRD.md) 与 [研发执行单](docs/DEV_HANDOFF.md) 实现的移动端优先前端验收版。所有学习记录默认从零开始，不预置成功记录。

## 在线体验

- 学习搭子：https://fengjiabin43.github.io/Demoday/
- 管理后台：https://fengjiabin43.github.io/Demoday/admin/
- 源码：https://github.com/fengjiabin43/Demoday

学习搭子使用模拟登录，输入任意 11 位数字即可开始，无需验证码。学习进度仅保存在当前浏览器；后台默认展示演示数据。

推送到 `main` 后，GitHub Actions 自动检查、构建并发布到 GitHub Pages。两个应用一起通过 `npm run build:pages` 构建，后台保留独立入口。

## 启动

需要 Node.js 22.12+ 或 24。

```powershell
npm install
npm run dev
```

浏览器打开 **http://127.0.0.1:5173/**。项目当前已启动本地开发服务。

```powershell
npm run build       # TypeScript 检查与生产构建
npm run preview     # 查看 dist 生产版，默认 http://127.0.0.1:4173/
npm test            # 19 项领域逻辑测试
npm run test:e2e    # 先启动开发服务；执行真实浏览器验收
```

浏览器测试首次运行需 `npx playwright install chromium`。前端运行不依赖 Python。

## 学习页：资讯与推荐

- `#learn` 为资讯：按 AI 行业 / AI 产品经理、来源和关键词筛选，支持收藏和原文跳转。当前为内置精选文章；公开网站、社区博客、个人博客及 X / Twitter 提供来源入口，尚未接入定时采集和社交平台 API。
- `#learn/recommended` 为推荐：保留学习接续，依据真实学习记录、关注主题、收藏、站内打开记录和内容形式偏好排序文章与原创视频，并展示推荐理由。支持不感兴趣、撤销及恢复隐藏内容。
- 通过“我的偏好”调整主题和形式、清除浏览记忆。偏好与收藏随学习数据保存在当前浏览器，可导出或全部清除；旧记录无需迁移。关闭设置中的偏好记录后，不再采集或使用隐式浏览与形式偏好，主动收藏和主题选择仍生效。
- `node tests/feed-browser.mjs` 验证两个 Tab 的筛选、持久化、反馈、课程跳转、新手引导、键盘导航及移动端布局（先启动开发服务）。`npm test` 包含推荐排序和存储失败的逻辑验证。

## 本次技术栈

- 前端：React 19、TypeScript 5、Vite 7 开发服务、esbuild 生产打包、Lucide 图标、原创 SVG 角色、CSS 动画。
- 本地模拟 API：`src/engine.ts` 的 `MockLearningAPI`，通过单次 localStorage 提交保持事件、证据、经验与形态一致；保存成功后 UI 才展示奖励。
- 后端规划：NestJS + PostgreSQL。本次不搭建或调用真实后端、账户、跨设备同步与开放模型。
- 媒体：3 条原创 60 秒 H.264 MP4 动画、WebVTT 字幕与 PNG 封面，均在 `public/media`。无旁白音轨，字幕默认开启。
- 缓存：Service Worker 缓存本地素材和已加载页面资源；已缓存内容可离线使用，尚未缓存的内容需联网。

## 验收入口

1. 首页点「先体验一下」，直接观看；可暂停、拖动、从头看，返回恢复播放位置。
2. 领养、改名、选择目标：三条路线分别从 V01、Q07、Q11 开始。
3. 作答 Q01，查看提示、解释与知识链接；刷新可恢复未提交选择。
4. 直接完成 Q03 / Q04，首次检查共 80 XP，解锁观察员；继续完成 Q07 / Q08 和 Q11 / Q12，可解锁连接者和探索者。
5. 工作台点知识节点，查看真实证据、关系、来源与相关内容。
6. 「用于我的工作」填写场景或使用示例，生成、编辑、保存、复制、导出判断卡。
7. 「搭子」查看外观库、经验流水和动画设置；记忆管理可修改目标、删除证据、删除对话、导出备份或清除全部数据。

## 实现边界

- 当前数据仅存于当前浏览器；换设备或清理浏览器数据会丢失，不提供登录或云同步。
- 搭子使用内置内容解释、提示、FAQ 和确定性规划规则，界面明确标注；没有实时模型调用。
- 更新卡是原创静态策展示例，没有自动全网资讯采集。
- 判断卡使用场景模板，没有对用户真实系统执行检测。
- 知识状态描述首版内容中的证据，不把经验、观看或一道题认定为一般能力。
- 统计为前台活动时间估算；文本操作后 60 秒无活动暂停，页面隐藏不计时，周一按上海日期重置周统计。
- 不包含 P1 的社交、商城、排行榜、更多主题与云同步。

## 文件结构

```text
src/App.tsx          页面与操作流程
src/Pet.tsx          四阶段原创知识精灵
src/engine.ts        模拟 API、持久化、规划、奖励、证据与应用
src/content.ts       3 视频、12 题、8 节点与 3 个来源
src/style.css        桌面与手机样式
public/media/        真实 MP4、字幕与封面
public/sw.js         离线缓存
scripts/make_media.py 原创动画的可复现制作脚本
tests/               领域逻辑和真实浏览器验收
docs/                PRD、执行单、技术说明与验收报告
```

重新制作媒体需要 `python -m pip install pillow imageio-ffmpeg` 后运行 `npm run media`；脚本默认使用 Windows 微软雅黑字体。原 PRD 与执行单保持不变。
