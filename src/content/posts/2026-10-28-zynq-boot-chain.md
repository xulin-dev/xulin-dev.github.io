---
title: ZYNQ 上电之后：从 FSBL 到应用启动的四个检查点
description: 板子不启动时，先别急着换镜像。把 BootROM、FSBL、U-Boot、内核四段分开，用串口和分区内容逐段验证。
date: 2026-10-28
tags: [ZYNQ, 启动流程, U-Boot, PetaLinux]
---

上电之后串口没有输出，或者日志停在 `Starting kernel ...`，是 ZYNQ 板子最常见的两种「不启动」。换镜像之前，先把启动链拆开，看证据停在哪一段。

## 四段链路

ZYNQ-7000 的启动顺序是固定的：

1. **BootROM**：读启动模式引脚，从 QSPI / SD / JTAG 找 `BOOT.BIN`，校验头部后把 FSBL 搬进 OCM。
2. **FSBL**：初始化 DDR、时钟、MIO，按需配置 PL，然后把 U-Boot 或应用搬到 DDR。
3. **U-Boot**：读环境变量，加载内核、设备树和 rootfs。
4. **内核**：解压、初始化驱动、挂 rootfs，最后执行 `init`。

每一段都有自己的「第一行日志」。串口什么都没看到，问题在 BootROM 或 FSBL；看到 `U-Boot 20xx` 之后停住，问题在 U-Boot 的加载参数；看到 `Starting kernel` 之后没有下文，通常是内核命令行、设备树或 rootfs 的问题。

## 检查点一：BOOT.BIN 到底装了什么

```bash
# 看 BOOT.BIN 的头部和分区表
bootgen -arch zynq -image boot.bif -w on -o BOOT.BIN
```

`boot.bif` 里应该能对上三件事：FSBL 的 elf、PL 的 bit（如果用）、U-Boot 的 elf。任何一项换了路径，都要重新打包，不能只替换 SD 卡里的文件。

## 检查点二：FSBL 有没有跑完

FSBL 阶段的串口输出很少，可以把 FSBL 的调试等级调高，或者直接看它有没有跳到下一段：

```text
Xilinx First Stage Boot Loader
Release 2023.2  ...
Loading: Boot mode: SD
...
Handoff Address: 0x00100000
```

没有 `Handoff` 这一行，说明 DDR 初始化或镜像校验失败了。此时用 JTAG 连上去读 `0xFFFF_FFF0` 附近的寄存器状态，比反复烧卡快。

## 检查点三：U-Boot 的加载地址

U-Boot 停住时，先看它打印的环境变量和实际分区：

```bash
printenv bootcmd
mmc list
fatls mmc 0:1
```

常见问题是 `boot.scr` 与 `image.ub` 不在同一个分区，或者 `bootargs` 里的 rootfs 路径写错，比如把 `mmcblk0p2` 写成了 `mmcblk1p2`。SD 卡和 eMMC 的编号在不同板子上并不固定，以 `mmc list` 的输出为准。

## 检查点四：内核命令行与 rootfs

内核已经启动但挂不上 rootfs 时，日志通常停在：

```text
VFS: Cannot open root device "mmcblk0p2" or unknown-block(179,2)
```

这时把 `bootargs` 抄出来逐项核对：

- `root=` 的设备名是否和实际块设备一致；
- `rootfstype=` 是否和镜像格式一致（ext4 / squashfs）；
- `rootwait` 有没有加，SD 卡枚举慢的时候需要它；
- 设备树里的 `chosen/bootargs` 会不会覆盖 U-Boot 传进去的值。

## 一张排查表

| 现象 | 先看哪里 |
| --- | --- |
| 串口完全无输出 | 启动模式引脚、BOOT.BIN、串口波特率 |
| 停在 FSBL | DDR 参数、bit 文件、FSBL 日志等级 |
| U-Boot 找不到镜像 | 分区号、文件名、`fatls` 结果 |
| `Starting kernel` 后无输出 | 内核命令行、设备树、earlycon |
| 挂 rootfs 失败 | `root=`、文件系统类型、`rootwait` |

把这几段分开之后，大部分「板子坏了」最后都能落到一个具体的文件或一行参数上。
