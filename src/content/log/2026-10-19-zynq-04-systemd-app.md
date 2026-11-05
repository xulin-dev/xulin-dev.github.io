---
title: 04 用 systemd 把应用收口
description: 从启动脚本迁到单元文件：依赖、重启策略、日志和看门狗。
date: 2026-10-19
series: zynq-bringup
order: 4
tags: [systemd, 板端运维]
---

应用跑起来之后，下一步是让它「不用人管」。把 `start.sh` 里的 `&`、`sleep` 和 `nohup` 换成单元文件。

## 单元文件

```ini
[Unit]
Description=Collector
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/opt/app/bin/collector
Restart=on-failure
RestartSec=3
User=app
Group=app
Environment=APP_CONFIG=/etc/app/collector.toml

[Install]
WantedBy=multi-user.target
```

`network-online.target` 需要 `systemd-networkd-wait-online` 或 `NetworkManager-wait-online` 支持，否则 `After` 没有意义。

## 启用与检查

```bash
systemctl daemon-reload
systemctl enable --now collector
systemctl status collector
journalctl -u collector -f
```

改完单元文件必须 `daemon-reload`，否则 systemd 用的还是旧版本。

## 看门狗

```ini
WatchdogSec=30
```

应用每 10 秒调一次 `sd_notify(WATCHDOG=1)`。主循环卡住时，systemd 会先发 `SIGABRT`，再按 `Restart` 拉起。比自己起一个监控线程更可靠。

## 日志

```bash
journalctl -u collector -b -n 100 --no-pager
journalctl -u collector --since "1 hour ago"
```

`-b` 只看本次启动，现场排障很有用。日志量大的话，在 `journald.conf` 里限制总量。
