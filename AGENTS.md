# 给 Agent 的说明

这是 Vibe Studio：用 Remotion 做“Vibe 知识”类短片的工程，音乐是全片的总谱。

- 还没装好（没有 `node_modules/`，或 `npm run doctor` 报错）：照 [AI-INSTALL.md](AI-INSTALL.md) 安装。
- 做片子用 `skills/` 里的两个 Skill：`vibe-content-planner` 管选题和写稿，`vibe-video-producer` 管画面、音乐和成片。你的技能目录里还没有它们，就运行 `node setup/install-skills.mjs --agent <你>`；也可以直接读 `skills/<名字>/SKILL.md` 照做。
- 工程根目录有 `profile.local.md` 就先读它，那是使用者自己的账号规则。
- 所有命令在工程根目录运行。改完片子跑 `npm run doctor`。
- 不要提交 `studio.local.json`、`profile.local.md`、`content/`、`references/private/` 和 `out/`。
