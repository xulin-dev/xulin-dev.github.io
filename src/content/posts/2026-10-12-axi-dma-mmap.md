---
title: AXI DMA + mmap：把 PL 采集搬进用户态
description: 从 PL 到用户态的一条零拷贝路径：描述符环、一致性内存、双缓冲，以及几个容易踩的对齐和 cache 问题。
date: 2026-10-12
tags: [ZYNQ, AXI DMA, mmap, 驱动]
---

PL 侧采到的数据要尽快进用户态处理，最省事的做法是 `read()` 到一个大 buffer 再拷贝，但帧率一高，`memcpy` 和上下文切换就成了瓶颈。更合适的路径是：驱动预留一段物理连续内存，用户态 `mmap` 进来，DMA 直接写，应用只处理「哪一帧好了」这件事。

## 数据通路

```text
PL -> AXI Stream -> DMA S2MM -> DDR (reserved) -> mmap -> 用户态
```

关键是 DDR 里的那块 buffer 必须**物理连续**，并且在启动时就从内核的伙伴系统里预留出来，否则大块分配会失败，cache 一致性也不好处理。

## 设备树里预留内存

```c
reserved-memory {
    #address-cells = <1>;
    #size-cells = <1>;
    ranges;

    dma_buf: buffer@30000000 {
        reg = <0x30000000 0x2000000>; /* 32 MiB */
        no-map;
    };
};

my_dma: dma@40400000 {
    compatible = "xlnx,axi-dma-7.1";
    reg = <0x40400000 0x10000>;
    interrupts = <0 29 4>;
    memory-region = <&dma_buf>;
};
```

`no-map` 表示内核不建立线性映射，驱动要自己 `memremap` 或 `dma_alloc_coherent`。如果用了 `no-map`，就不能再对它做 `virt_to_phys`。

## 驱动侧：三次映射要分清

1. **DMA 地址**：给 DMA 控制器写描述符用的地址，必须走 `dma_map_single` 或一致性分配。
2. **CPU 虚拟地址**：驱动内部访问用。
3. **用户态映射**：`mmap` 把同一块物理内存再映射一次，供应用读取。

一个常见的错误是：驱动 `dma_alloc_coherent` 拿到 `cpu_addr` 和 `dma_handle`，`mmap` 时却用 `virt_to_phys(cpu_addr)` 去算 `vm_pgoff`。在带 `no-map` 或高地址内存的配置下，这个转换不成立。直接保存 `dma_handle`，在 `mmap` 里按页对齐后使用。

## 双缓冲与帧序号

单缓冲的问题是：DMA 写第 N+1 帧时，应用可能还在读第 N 帧。用两个（或更多）槽位，并让硬件在每帧结束时更新写指针：

```c
struct frame_slot {
    void *addr;
    size_t len;
    u32 seq;
};

/* 中断里只做三件事：确认状态、记录长度、切换槽位 */
static irqreturn_t dma_irq(int irq, void *dev)
{
    struct my_dev *priv = dev;
    u32 tail = readl(priv->base + S2MM_TAIL);

    priv->slots[priv->cur].len = tail;
    priv->slots[priv->cur].seq = ++priv->seq;
    priv->cur = (priv->cur + 1) % 2;
    writel(priv->slots[priv->cur].dma, priv->base + S2MM_NEXT);

    wake_up_interruptible(&priv->wq);
    return IRQ_HANDLED;
}
```

应用侧用 `poll()` 等可读，再用 `ioctl` 取当前槽位的长度和序号。不要在中断里拷贝数据，也不要在中断里唤醒后立刻切换，把「准备好」和「已消费」分成两个状态。

## 对齐与 cache

- AXI DMA 的 `cdesc` 要求描述符按 64 字节对齐，缓冲区起始地址最好也按页对齐。
- 非一致性内存需要在启动 DMA 前 `dma_sync_single_for_device`，读之前 `dma_sync_single_for_cpu`；一致性内存则可以省掉这部分。
- 长度按 cache line 向上取整，否则最后一行的数据可能是旧的。

## 排查顺序

1. `cat /proc/iomem | grep -i dma` 看预留区是否真的被保留。
2. 看 DMA 寄存器的 `S2MM_STATUS`，`IOC_Irq` 有没有置位。
3. 用 `devmem` 读一小段 buffer，确认 PL 数据真的写进来了。
4. 再查应用侧 `mmap` 的偏移和长度是否与驱动一致。

这套结构搭好之后，采集线程只负责「拿帧、处理、归还」，和硬件之间的耦合就只剩一个 `poll`。
