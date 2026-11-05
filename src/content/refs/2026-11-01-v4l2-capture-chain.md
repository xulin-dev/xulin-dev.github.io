---
title: V4L2 采集链路速查
description: 从 /dev/video0 到 dma-buf：常用 ioctl、缓冲队列状态机，以及「能出图但帧率不稳」时先看哪里。
date: 2026-11-01
tags: [V4L2, 视频采集, Linux]
---

板端接摄像头或 PL 视频通路时，V4L2 是最常见的用户态入口。这份速查只记实际会用到的部分。

## 最小流程

```c
int fd = open("/dev/video0", O_RDWR | O_NONBLOCK);

struct v4l2_format fmt = { .type = V4L2_BUF_TYPE_VIDEO_CAPTURE };
fmt.fmt.pix.width = 1920;
fmt.fmt.pix.height = 1080;
fmt.fmt.pix.pixelformat = V4L2_PIX_FMT_NV12;
fmt.fmt.pix.field = V4L2_FIELD_NONE;
ioctl(fd, VIDIOC_S_FMT, &fmt);
```

顺序是：`VIDIOC_QUERYCAP` → `S_FMT` → `REQBUFS` → `QUERYBUF` → `mmap` → `QBUF` → `STREAMON`。少一步都可能拿到 `EINVAL`。

## 队列状态

每个 buffer 在 `QUEUED`、`DONE`、`DEQUEUED` 之间转：

- `VIDIOC_QBUF` 把空 buffer 还给驱动；
- `select/poll` 或 `VIDIOC_DQBUF` 拿到已填数据的 buffer；
- 处理完必须再次 `QBUF`，否则队列会耗尽。

「跑着跑着不出图」大多是忘了归还 buffer。

## 帧率不稳先看三处

1. `v4l2-ctl --stream-mmap --stream-count=100` 看实际帧率；
2. `dmesg | grep -i xilinx` 看 DMA 溢出或 `sync lost`；
3. 应用侧每次 `DQBUF` 到 `QBUF` 的耗时，超过一帧时间就会丢帧。

## dma-buf 的场景

零拷贝到编码器或显示端时，用 `VIDIOC_EXPBUF` 导出 fd，再把这个 fd 传给下游。注意所有权：导出后 buffer 仍然属于 V4L2 队列，下游用完要 `close(fd)`，但不要提前 `REQBUFS(0)`。
