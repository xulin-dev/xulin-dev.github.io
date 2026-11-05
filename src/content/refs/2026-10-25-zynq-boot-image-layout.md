---
title: ZYNQ 启动镜像布局速查
description: BOOT.BIN、image.ub、boot.scr 各自装什么，QSPI 与 SD 两种启动方式的分区怎么放。
date: 2026-10-25
tags: [ZYNQ, 启动流程, 镜像]
---

## 三个镜像文件

| 文件 | 内容 | 由谁读 |
| --- | --- | --- |
| `BOOT.BIN` | FSBL + bitstream + U-Boot | BootROM |
| `image.ub` | 内核 + 设备树 + rootfs（ FIT 格式） | U-Boot |
| `boot.scr` | U-Boot 脚本，设置 `bootargs` 并加载 | U-Boot |

`BOOT.BIN` 的第一阶段必须是 FSBL，BootROM 只认这个格式。`image.ub` 是 FIT，可以用 `dumpimage -l image.ub` 列出里面的组件。

## SD 卡布局

```text
p1  FAT32   BOOT.BIN  image.ub  boot.scr
p2  ext4    rootfs
```

FAT32 分区要设 `boot` 标志，否则部分板子的 BootROM 不认。

## QSPI 布局

```text
0x000000  BOOT.BIN
0x500000  image.ub
0x900000  rootfs (jffs2/ubifs)
```

地址要和 U-Boot 的 `mtdparts` 一致，改分区表时三处一起改：QSPI 烧写脚本、`mtdparts`、`bootargs`。

## 常用命令

```bash
# 查看 FIT 内容
dumpimage -l image.ub

# 重新打包启动镜像
petalinux-package --boot --fsbl zynq_fsbl.elf --fpga system.bit --u-boot --force

# 从 U-Boot 里看分区
mtd list
mmc list
```
