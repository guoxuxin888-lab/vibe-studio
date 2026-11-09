# 开源前清单

公开仓库由私有工程按白名单导出（`tools/export-public.mjs`，只在作者的私有工程里），导出时会扫一遍敏感内容，命中就失败。

## 第一步：脱敏导出（已完成，待作者检查）

- [x] 两个 Skill 搬进 `skills/`，去掉个人内容：账号规则、个人资料库路径、个人工程路径改成读本地的 `profile.local.md`。
- [x] `vibe-content-planner/references/evidence.md` 只保留统计结论，不列别人作品的标题、账号和原句。
- [x] `topic.md`、`script.md`、`visual.md`、`sound.md` 里的账号名、原句和样本编号已改写。
- [x] `tools/remotion.cjs` 不再写死临时目录，改读 `studio.local.json` 或环境变量；也可以指定本机浏览器。
- [x] 片单只留示例片 `sunk-cost`。
- [x] `libraries/reference-ranges.json` 只有统计范围。
- [x] 项目名和许可证持有人：Vibe Studio（`LICENSE` 写 `Vibe Studio contributors`，2026-11-08 作者确认）。
- [ ] 核对 [Remotion 许可](https://www.remotion.dev/license)，确认 NOTICE 的说法还对。
- [ ] 跑一遍 `npm run doctor` 和 `npm run check`。

## 第二步：让不同的 Agent 都能稳定出片

- [ ] 把两种画风（汉风扁平、彩色几何平涂图解叙事）的人物、场景、字块、信息卡做成可复用的套件。
- [ ] 场景清单：Agent 写“第几拍出什么”，套件负责画。
- [ ] 把这些做成命令：测配音里每个字的起点、动作对到最近的拍、字幕块和内容包逐字核对、两遍响度归一加封装加同步检查（`npm run deliver`）。
- [ ] 一部不带品牌、不带配音的完整示例片，加一份从内容包到成片的中文教程。

## 第三步：在干净的机器上验证

- [ ] 在一台干净的 Windows 机器上，按 README 从头跑通。
- [ ] 分别用 Claude Code、Kimi Code、WorkBuddy、TRAE 从内容包做出样片，记录卡在哪里。
- [x] 一键安装：`setup/` 里的脚本检查并安装 Node、ffmpeg、浏览器，跑体检和试渲染，再把 Skill 装进 Agent；`AI-INSTALL.md` 让 Agent 读链接自己装（2026-11-09，Windows 已在全新副本实测；winget 安装分支和 macOS/Linux 脚本未实机验证）。

## 建议做

- [ ] 扩充动效库，逐个按拍重写，不要搬带品牌的旧模板。
- [x] README 的演示动图和案例（2026-11-09）。
- [ ] 英文说明。
