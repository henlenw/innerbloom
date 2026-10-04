# 心森 InnerBloom · 当前静态版

这是当前公开网站所用版本的脱敏源码，包含 30 个测试、242 道题、120 份分析结果和浏览器兑换码生成器。已包含 2026-10-04 发布的结果文案改进。

公开网站：[心森 InnerBloom](https://innerbloom-quiz.pages.dev/)

## 本地运行

从仓库根目录进入本目录。准备 Node.js 22 或更新的受支持版本，以及 pnpm。

```sh
cd static-site
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm preview
```

按终端显示的本地地址打开网站。需要修改页面时，可运行 `pnpm dev`。

## 功能

- 完成测试后只出现兑换入口，兑换成功后才显示结果。
- 结果包括一句话结论、实际答案依据、具体特点、优势、简短提醒和一句收尾。
- 可生成分享卡片，或复制分享文字。
- `/tools/code-generator` 和 `/code-generator` 提供生成器，无需登录。
- 支持单项、恋爱、职业、性格与成长和全部测试；每批 10、50 或 100 个码。
- 生成码按前缀识别范围，可重复使用，无需数据库或服务器同步。
- 答案和解锁记录只保存在当前浏览器。清除浏览器数据后需要重新答题、兑换。

本版本没有管理后台、账号、使用次数统计或一次性兑换功能。根目录的后台升级版本单独维护。

## 演示配置

上传副本在 `src/config/redeemCodes.ts` 中使用以下固定演示值：

| 范围 | 演示码 |
| --- | --- |
| 恋爱 | `DEMOLOVE` |
| 职业 | `DEMOCAREER` |
| 性格与成长 | `DEMOPERSONALITY` |
| 全部测试 | `DEMOALL` |

这些值供本地运行或自己的部署验证使用。原网站固定兑换码配置没有包含在此文件中。生成器算法与范围规则保持原样；日常生成码不需要修改配置。

本版本按纯前端规则验证，规则和结果数据随静态资源分发。页面流程中的结果锁定不提供服务端访问控制。

## 部署到自己的免费静态托管

构建命令为 `pnpm build`，输出目录为 `dist`。可将它部署到自己的 Cloudflare Pages 项目。

```sh
pnpm exec wrangler pages deploy dist --project-name your-pages-project --branch main
```

`your-pages-project` 是占位符，替换为自己账号中的 Pages 项目名称。登录凭据由官方工具保存在本机，不应写进项目文件。

如从 GitHub 在托管平台构建，将根目录设为 `static-site`，构建命令设为 `pnpm build`，输出目录设为 `dist`。

## 检查与脱敏

`pnpm check` 检查 15,360 组答题路径、120 份结果的长度与解锁条件，并生成 800 个临时代码进行 24,000 次范围权限检查。生成的测试数据不会写入项目。

本目录未包含密钥、授权信息、个人邮箱、数据库、客户记录、已发放的兑换码批次、原始文档、截图、构建产物或依赖目录。`.gitignore` 由仓库根目录统一管理。
