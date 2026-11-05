---
title: 交叉编译 sysroot 三件事
description: 换一台机器就编不过，多半是 sysroot、工具链前缀和动态库路径没对齐。
date: 2026-10-08
tags: [交叉编译, 工具链, CMake]
---

## 一、工具链要固定版本

把工具链路径、版本写进工程，不要依赖 `PATH` 里碰巧存在的 `arm-linux-gnueabihf-gcc`：

```bash
export CROSS_COMPILE=/opt/toolchains/xilinx-2023.2/bin/arm-linux-gnueabihf-
export SYSROOT=/opt/toolchains/xilinx-2023.2/sysroot
```

版本不一致时，最先出问题的是 C++ 标准库符号。

## 二、sysroot 里要有目标机的库

```bash
arm-linux-gnueabihf-gcc --sysroot=$SYSROOT -print-sysroot
ls $SYSROOT/usr/lib/libstdc++.so*
```

如果只拷贝了头文件，链接阶段会报 `cannot find -lxxx`。运行时再看 `ldd` 和 `readelf -d` 确认解释器路径。

## 三、CMake 用 toolchain 文件

```cmake
# toolchain-arm.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER arm-linux-gnueabihf-gcc)
set(CMAKE_CXX_COMPILER arm-linux-gnueabihf-g++)
set(CMAKE_SYSROOT /opt/toolchains/xilinx-2023.2/sysroot)
set(CMAKE_FIND_ROOT_PATH ${CMAKE_SYSROOT})
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

```bash
cmake -B build -DCMAKE_TOOLCHAIN_FILE=toolchain-arm.cmake
```

检查产物架构：

```bash
file build/app
# ELF 32-bit LSB executable, ARM, EABI5
```

三条对齐之后，「我这边能编」就少很多。
