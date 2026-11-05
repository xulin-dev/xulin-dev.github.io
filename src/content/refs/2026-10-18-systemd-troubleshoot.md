---
title: systemd 单元与日志排障清单
description: 服务起不来、起来又退出、日志找不到：先从这 12 条命令开始。
date: 2026-10-18
tags: [systemd, 日志, 排障]
---

## 服务状态

```bash
systemctl status app --no-pager -l
systemctl cat app
systemctl show app -p ExecStart -p Restart -p User
```

`status` 只给摘要，`cat` 才能看到实际生效的单元文件（包括 drop-in）。

## 启动失败

```bash
journalctl -u app -b --no-pager -n 200
systemd-analyze verify /etc/systemd/system/app.service
systemd-analyze critical-chain app.service
```

`verify` 能提前发现拼错的 `After=`、不存在的可执行文件。`critical-chain` 用来看启动慢在哪个依赖。

## 日志

```bash
journalctl -u app --since "10 min ago"
journalctl -p err -b
journalctl --disk-usage
journalctl --vacuum-size=64M
```

## 定时任务

```bash
systemctl list-timers --all
systemctl status app.timer
```

`list-timers` 显示下一次触发时间；没出现说明 `timer` 没 enable，或者 `OnCalendar` 写错了。

## 常见退出码

| 退出码 | 含义 |
| --- | --- |
| 0 | 正常退出，`Restart=always` 仍会拉起 |
| 1 | 应用自身报错，看应用日志 |
| 203 | `ExecStart` 不可执行或解释器缺失 |
| 226 | `ExecStart` 指向的文件不存在 |
| 200 | 权限或 SELinux 拒绝 |
