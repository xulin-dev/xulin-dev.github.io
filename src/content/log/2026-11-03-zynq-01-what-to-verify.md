---
title: 01 拿到一块 ZYNQ 板子，先跑通什么
description: 先不写应用。串口、启动链、网络和存储这四件事通了，后面的调试才有落脚点。
date: 2026-11-03
series: zynq-bringup
order: 1
tags: [ZYNQ, 上手, 串口]
---

新板子到手，最容易犯的错是先改代码。先确认四件基础设施，否则后面每个问题都要重新排一遍。

## 串口

USB 转串口接 `UART1`，波特率 115200，8N1。先把线序和电平确认清楚：ZYNQ 的 UART 是 3.3V TTL，直接接 RS232 会烧。

```bash
picocom -b 115200 /dev/ttyUSB0
```

能从上电看到 `Xilinx First Stage Boot Loader`，说明供电、时钟、串口都正常。

## 启动介质

把官方镜像写到 SD 卡，确认能从 SD 启动：

```bash
sudo dd if=image.iso of=/dev/sdX bs=4M status=progress
sync
```

再把启动模式拨到 SD，重启。如果只有 QSPI 启动，先用 JTAG 把 FSBL 和 U-Boot 跑起来，确认 DDR 参数没问题。

## 网络

```bash
ip addr
ping -c 3 192.168.1.1
```

静态地址、默认网关、DNS 各确认一次。板子没有网络时，至少保证串口能传文件：

```bash
# 主机侧
python3 -m http.server 8000
# 板端
wget http://192.168.1.10:8000/app
```

## 存储

```bash
df -h
mount | grep -E "mmc|ubi"
```

确认 rootfs 可写、data 分区存在。如果 rootfs 是只读 squashfs，应用配置要放到独立分区，别等现场才发现写不进去。

四件事都通了，再开始碰 PL 和驱动。
