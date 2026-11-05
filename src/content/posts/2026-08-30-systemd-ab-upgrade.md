---
title: systemd 管住板端应用：自启、看门狗与 A/B 升级
description: 现场设备没人值守，应用要能自己起来、崩了能拉起、升级失败能回去。用 systemd 把这三件事收进单元文件，而不是散在脚本里。
date: 2026-08-30
tags: [systemd, 板端运维, 升级]
---

板端应用和服务器应用最大的差别是：设备装在现场，没人会去 `kill` 一下再重启。应用的启动顺序、崩溃恢复和升级回滚，最好都在 systemd 里说清楚，而不是靠一个 `start.sh` 里堆 `sleep`。

## 三个单元，各自负责一件事

```ini
# /etc/systemd/system/collector.service
[Unit]
Description=Frame collector
After=network.target local-fs.target
Wants=uploader.service

[Service]
Type=notify
ExecStart=/opt/app/bin/collector --config /etc/app/collector.toml
WatchdogSec=30
Restart=always
RestartSec=2
StartLimitIntervalSec=60
StartLimitBurst=5
StateDirectory=collector
LogsDirectory=collector

[Install]
WantedBy=multi-user.target
```

`Type=notify` 要求应用主动 `sd_notify(READY=1)`，好处是 systemd 知道应用「真的起来了」，而不是 fork 完就算成功。`WatchdogSec=30` 则要求应用定期 `sd_notify(WATCHDOG=1)`，卡死时由 systemd 重启，而不是等看门狗芯片。

## 启动顺序不要靠 sleep

`After=` 只保证顺序，不保证对方可用。数据库没起来时，应用应该重试，而不是在单元里写 `ExecStartPre=/bin/sleep 10`。更稳的做法是把「等依赖就绪」放进应用自己的启动逻辑，或者用 `systemd` 的 `ExecStartPre` 调一个小脚本做健康检查。

## 升级：A/B 两个槽位

分区布局：

```text
mmcblk0p1  boot     FAT32   BOOT.BIN, image.ub
mmcblk0p2  rootfs_a ext4
mmcblk0p3  rootfs_b ext4
mmcblk0p4  data     ext4    应用配置与缓存
```

升级脚本只做四步：

1. 把新 rootfs 写到非当前槽位；
2. 校验 sha256；
3. 修改 U-Boot 环境变量 `bootargs` 指向新分区，并记录 `upgrade_pending=1`；
4. 重启。

第一次启动成功后，由应用清掉 `upgrade_pending`；如果新系统连续启动失败，U-Boot 的 `bootcount` 达到阈值就切回旧槽位。关键是**数据分区独立**，回滚不会丢配置。

## 日志要能在断电后看

`journald` 默认写到 `/run`，掉电就没了。改成持久化，同时限制总量：

```ini
# /etc/systemd/journald.conf.d/persist.conf
[Journal]
Storage=persistent
SystemMaxUse=64M
SystemMaxFileSize=8M
```

应用自己的关键状态再写一份 ring buffer 到 data 分区，因为 journal 在极端情况下也可能损坏。

## 现场排障的几条命令

```bash
systemctl status collector --no-pager
journalctl -u collector -b -n 100 --no-pager
systemctl list-timers
systemd-analyze critical-chain collector.service
```

`critical-chain` 能直接看出启动慢在哪个依赖上；`list-timers` 则用来确认定时任务有没有被漏掉。

把这些收进单元文件之后，板端的「自启、拉起、回滚」就不再依赖某个人记得手动执行哪条命令了。
