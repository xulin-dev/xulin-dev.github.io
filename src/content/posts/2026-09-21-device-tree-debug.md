---
title: 设备树调试：从 /proc/device-tree 到驱动 probe
description: 加了一个自定义 IP，驱动就是不 probe。按「设备树有没有进来、节点有没有匹配、资源有没有拿到」三步查，比反复改 dts 快得多。
date: 2026-09-21
tags: [设备树, ZYNQ, Linux 驱动]
---

给 PL 加了一个自定义 IP，内核也编了对应的驱动，但 `dmesg` 里就是没有 probe 的日志。这类问题通常不在驱动代码，而在设备树到驱动之间的三个环节。

## 第一步：设备树真的进来了吗

PetaLinux 构建时容易改了 `system-user.dtsi`，实际启动用的却是旧的 `system.dtb`。先确认当前运行的设备树：

```bash
# 从运行中的内核导出
dtc -I fs -O dts /proc/device-tree > running.dts

# 看目标节点是否存在
ls /proc/device-tree/ | grep -i myip
```

如果 `/proc/device-tree` 下没有节点，后面都不用查了：先确认 `petalinux-build -c device-tree` 生成的 dtb 有没有被打进镜像，以及 U-Boot 加载的是不是这个文件。

## 第二步：compatible 是否匹配

```bash
grep -r "my-ip" /proc/device-tree/
```

驱动里写的是：

```c
static const struct of_device_id my_ip_of_match[] = {
    { .compatible = "vendor,my-ip-1.0" },
    { /* sentinel */ }
};
MODULE_DEVICE_TABLE(of, my_ip_of_match);
```

设备树里必须一字不差：

```c
my_ip: my-ip@43c00000 {
    compatible = "vendor,my-ip-1.0";
    reg = <0x43c00000 0x10000>;
    interrupt-parent = <&intc>;
    interrupts = <0 31 4>;
    clocks = <&clkc 15>;
};
```

大小写、逗号、版本号后缀都算不同 compatible。改完之后 `depmod -a`，再 `modprobe`，否则模块别名表还是旧的。

## 第三步：资源拿到了吗

节点匹配上但 probe 失败，日志里通常会有 `-ENODEV` 或 `-EINVAL`。在 probe 开头把资源打印出来：

```c
static int my_ip_probe(struct platform_device *pdev)
{
    struct resource *res;
    int irq;

    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    if (!res)
        return dev_err_probe(&pdev->dev, -ENODEV, "no reg\n");

    irq = platform_get_irq(pdev, 0);
    if (irq < 0)
        return dev_err_probe(&pdev->dev, irq, "no irq\n");

    dev_info(&pdev->dev, "mem %pa len %pa irq %d\n",
             &res->start, &resource_size(res), irq);
    return 0;
}
```

常见原因：

- `reg` 的地址和 PL 的实际地址对不上，AXI 互联没连；
- 中断号在 `interrupts` 里写的是 SPI 编号，而控制器需要的是加上 32 之后的号；
- `clocks` 引用了不存在的时钟，`devm_clk_get` 返回 `-ENOENT`；
- 节点 `status = "disabled"`，或者父节点没开。

## 几个容易忽略的点

**`/proc/device-tree` 的格式**：字符串属性没有结尾换行，`cat` 出来会和下一行粘在一起，用 `hexdump -C` 看更准确。

**overlay 的顺序**：用 `dtbo` 叠加时，后加载的 overlay 可能覆盖前面的节点，确认 `uEnv.txt` 里的加载顺序。

**地址空间**：ZYNQ 的 PL 地址从 `0x40000000` 起，PS 的 DDR 从 `0x00000000` 起。自定义 IP 的 `reg` 落在 DDR 范围内，DMA 会直接踩内存。

**驱动绑定日志**：打开 `CONFIG_OF_DEBUG` 后，`dmesg` 会打印每个节点的匹配过程；临时加 `of_devlink` 也能看出绑定关系。

查设备树问题时，「先证明节点在、再证明 compatible 对、最后证明资源拿得到」，三步走完基本就定位了。
