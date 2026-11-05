---
title: 02 PetaLinux 工程与 SDK：把环境变成可重复的
description: 工程目录、配置分层和 SDK 生成，目标是换一台机器也能一次编出同样的镜像。
date: 2026-11-02
series: zynq-bringup
order: 2
tags: [PetaLinux, Yocto, SDK]
---

PetaLinux 本质上是 Yocto 的一层封装。工程建好之后，真正要维护的是三样东西：配置、配方和构建脚本。

## 工程结构

```text
petalinux/
├── project-spec/
│   ├── configs/
│   │   ├── config           # 内核与 rootfs 总配置
│   │   └── rootfs_config
│   └── meta-user/
│       ├── recipes-apps/    # 自己的应用
│       └── recipes-bsp/     # 设备树、u-boot 补丁
├── build/
└── images/linux/
```

`project-spec` 进 Git，`build` 和 `images` 不进。每次构建前 `petalinux-build -x mrproper` 能排除缓存干扰，但日常迭代不需要。

## 配置分层

- 硬件相关：`system-user.dtsi`、`u-boot/config`；
- 内核：`kernel/config` 里的 fragment；
- rootfs：`rootfs_config` 里按包名开关。

不建议直接改 `build/` 下的文件，重新构建就丢了。

## 生成 SDK

```bash
petalinux-build
petalinux-package --sysroot
# 生成 images/linux/sdk.sh
```

```bash
./sdk.sh -d /opt/petalinux-sdk
source /opt/petalinux-sdk/environment-setup-aarch64-xilinx-linux
```

之后 `$CC`、`$CXX` 和 sysroot 都由环境脚本提供，应用工程直接用这套环境编译，和 rootfs 里的库版本保持一致。

## 一次可重复的构建

把「拉代码 → 配环境 → 构建 → 打包」写成脚本，并在 CI 里跑。板上问题最难查的一类，就是本地编出来的镜像和现场跑的不是同一份。
