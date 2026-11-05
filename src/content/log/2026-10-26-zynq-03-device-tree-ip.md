---
title: 03 设备树里加一个自定义 IP
description: 地址、中断、时钟三样对齐，驱动才可能 probe 成功。
date: 2026-10-26
series: zynq-bringup
order: 3
tags: [设备树, ZYNQ, AXI]
---

PL 里加了一个 AXI 外设，需要在设备树里补节点。最容易错的是地址和中断号，先把这两样从 Vivado 的地址编辑器里抄准。

## 节点

```c
&amba {
    my_ip: my-ip@43c00000 {
        compatible = "vendor,my-ip-1.0";
        reg = <0x43c00000 0x10000>;
        interrupt-parent = <&intc>;
        interrupts = <0 31 4>;
        clocks = <&clkc 15>;
        status = "okay";
    };
};
```

`amba` 是 ZYNQ 的 AXI 总线节点，PL 外设挂在它下面。`reg` 的地址必须和 Vivado 里分配的基地址一致，长度覆盖所有寄存器。

## 中断号

`interrupts = <0 31 4>` 里的 `31` 是 SPI 编号，实际中断号 = 32 + 31 = 63。驱动里用 `platform_get_irq()` 拿，不要自己算。

如果 PL 中断经过 `axi_intc`，`interrupt-parent` 要指向那个控制器，编号规则也跟着变。

## 时钟

`clocks` 引用的是 PS 的时钟源。拿不到时钟时 `devm_clk_get()` 返回 `-ENOENT`，驱动 probe 会直接失败。先确认时钟在 `clkc` 节点里存在，再确认 `clock-names` 和驱动里请求的名字一致。

## 验证

```bash
ls /proc/device-tree/amba/ | grep my-ip
cat /sys/bus/platform/devices/*/driver 2>/dev/null
dmesg | grep -i my-ip
```

节点在、compatible 对、资源拿得到，probe 基本就过了。
