# 心森 InnerBloom

一个以森林与成长为主题的趣味测试网站，包含恋爱、职业、性格与成长三类共 30 个测试。

公开网站：[innerbloom-quiz.pages.dev](https://innerbloom-quiz.pages.dev/)

## 版本状态

本仓库是已脱敏的后台升级版源码。截至 2026-10-04，升级版已完成本地验证，尚未部署到公开网站；公开网址仍运行上一版。创建生产 D1 数据库、配置生产密钥并部署后，才能在线使用本仓库的管理后台与一次性兑换码功能。

## 用户与运营流程

用户选择测试、完成答题、输入兑换码，验证成功后查看完整分析并分享图片。兑换前不展示类型、动物、关键词、分数、摘要或分析预览。

管理员在 `/admin` 使用独立密码登录，可以生成单项、恋爱、职业、性格与成长或全部测试兑换码，查看使用状态、复制和导出 TXT / CSV。支持每批 1–100 个码，每个码只能成功兑换一次。部署完成后，日常生成和管理兑换码不需要修改代码。

兑换权限绑定当前浏览器 Cookie。刷新页面可以继续查看；更换设备、浏览器或清除浏览器数据后，不能恢复原兑换权限。答案保存在当前浏览器，生成分析时临时提交给同源服务，不写入数据库。

测试用于娱乐和自我观察，不提供心理诊断。

## 技术结构

- React、TypeScript、Vite、Tailwind CSS。
- Cloudflare Pages 提供静态页面；Pages Functions 处理 `/api/*` 同源接口。
- D1 保存兑换码、范围、时间、匿名浏览器标识和短期请求计数。
- 完整分析在服务端确认兑换权限后返回，不打包到浏览器页面中。
- 管理员密码与会话密钥通过环境变量提供；管理员使用 HttpOnly 会话 Cookie。

可以使用 Cloudflare 免费计划，但平台请求量和数据库配额有限；本项目不会自动开通付费套餐。当前额度以 [Pages Functions 官方说明](https://developers.cloudflare.com/pages/functions/pricing/)和 [D1 官方说明](https://developers.cloudflare.com/d1/platform/pricing/)为准。

## 本地启动

准备 Node.js 22 或更新的受支持版本，以及 pnpm。

```sh
pnpm install --frozen-lockfile
node scripts/prepare-secrets.mjs
pnpm check
pnpm build
pnpm exec wrangler d1 execute innerbloom-codes --local --file migrations/0001_codes.sql
pnpm exec wrangler pages dev dist --ip 127.0.0.1 --port 5180
```

打开 `http://127.0.0.1:5180/`；后台地址为 `http://127.0.0.1:5180/admin`。本地管理员密码在自动生成的 `.private/cloudflare-secrets.json` 中。该目录及 `.dev.vars` 已被 Git 忽略，不要上传。

`pnpm dev` 只启动前端开发服务；完整兑换与后台流程需要上述 Pages 本地服务。

在另一个终端运行本地接口验收：

```sh
node scripts/check-api.mjs
```

该脚本仅允许本地地址，会创建测试兑换码并消耗其中一部分。不要用于生产数据库。

## 部署到自己的 Cloudflare 账号

1. 使用官方 Wrangler 登录自己的 Cloudflare 账号。
2. 创建 Pages 项目和 D1 数据库。修改 `wrangler.json` 中的项目名、数据库名及数据库 ID；现有 ID 是占位值，不关联任何真实数据库。
3. 应用数据库迁移，并为 Pages 项目设置 `ADMIN_PASSWORD` 和 `ADMIN_SESSION_SECRET` 两个 Secret。为生产环境生成独立随机值。
4. 构建、部署，再验证真实公开网址的兑换与管理流程。

以下命令中的项目名与数据库名必须与自己的配置一致：

```sh
pnpm exec wrangler d1 migrations apply innerbloom-codes --remote
pnpm exec wrangler pages secret put ADMIN_PASSWORD --project-name innerbloom-quiz
pnpm exec wrangler pages secret put ADMIN_SESSION_SECRET --project-name innerbloom-quiz
pnpm build
pnpm exec wrangler pages deploy dist --project-name innerbloom-quiz --branch main
```

Secret 命令会交互式读取输入，避免将真实值写进源码或命令历史。后续更新保留现有生产密钥和数据库。

## 源码目录

| 路径 | 内容 |
| --- | --- |
| `src/` | 页面、答题、分享、管理员界面及测试内容 |
| `src/data/public.ts` | 浏览器可用的题目数据，不含结果画像 |
| `server/api.ts` | 鉴权、兑换、服务端结果和后台接口 |
| `functions/api/[[path]].ts` | Pages Functions 入口 |
| `migrations/` | 数据库结构迁移，不含运营记录 |
| `public/` | 路由、安全响应头和搜索抓取配置 |
| `scripts/` | 内容检查、本地接口验收与本地密钥初始化 |

## 已完成的本地验证

- TypeScript 检查与生产构建。
- 30 个测试、242 道题、120 份结果以及 15,360 条评分路径。
- 72 项接口检查，包括鉴权、兑换范围、一次性并发兑换、刷新保留权限和导出。
- 浏览器验证答题后锁定、成功兑换、后台使用状态、批量复制、CSV 下载及手机宽度布局。

微信、小红书内置浏览器及真实 iPhone / Android 设备仍需实机验证。

## 脱敏范围

本仓库仅包含运行所需源码、依赖锁定文件、结构迁移和占位配置。未包含管理员密码、会话密钥、平台授权、个人账号信息、真实数据库 ID、兑换码记录、数据库文件、浏览器数据、本地路径、测试截图、原始文档或旧源码压缩包。安全相关占位符和本地测试用例不代表真实凭据。
