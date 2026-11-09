# Skills

两个 Skill 配合这个工程用，格式是通用的 `SKILL.md` 文件夹，可以装进各家 Agent：

| Skill | 管什么 |
|---|---|
| `vibe-content-planner` | 选题、写字幕稿或配音稿、核事实、内容包、发布文案、复盘 |
| `vibe-video-producer` | 画风、音乐和拍格、画面、音效、样片、成片、体检 |

先用策划写出内容包，再用制作把它做成片。两个都装上。

## 安装

整个文件夹复制过去（`SKILL.md` 和 `references/`、`scripts/` 要在一起），不要只复制 `SKILL.md`。

| Agent | 放在哪 |
|---|---|
| Claude Code | `~/.claude/skills/`（所有项目）或工程里的 `.claude/skills/` |
| Codex | `~/.codex/skills/` |
| Kimi Code CLI | `~/.kimi-code/skills/` 或 `~/.agents/skills/`，也可以用 `--skills-dir` 指定；用 `/skill:vibe-video-producer` 调用 |
| WorkBuddy | 技能面板里导入，或把文件夹打成 ZIP 导入（ZIP 根目录要有 `SKILL.md`） |
| TRAE（可选豆包模型） | 工程里的 `.trae/skills/`，或在设置的“规则和技能”里导入 |

各家的安装方式会更新，以它们的官方说明为准。豆包 App 本身是聊天工具，跑不了本地渲染；想用豆包模型，请用 TRAE。

## 你的账号规则

Skill 里只写通用流程。你自己的账号名、写作习惯、敏感词替换、署名角色、品牌色、内容包放在哪，写进工程根目录的 `profile.local.md`（模板见 `profile.example.md`，不进 git）。两个 Skill 开工前都会先读它。

## Agent 要能做的事

做片子要在你的电脑上运行命令：Node、ffmpeg、Remotion 渲染。用的 Agent 必须能执行终端命令、读写工程文件。环境还没装的，先运行 `setup/` 里的一键安装脚本，或把 README“安装”一节里的那段话发给 Agent 让它装；第一次开工先让它跑 `npm run doctor`。

模型越强，画面写得越好。复杂的角色动作和转场，较弱的模型可能需要你多看几轮样片。
