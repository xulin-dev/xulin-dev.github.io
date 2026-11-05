---
title: 01 进程、线程与调度：先看清再优化
description: 板端 CPU 只有两三个核，线程不是越多越好。用 ps、top 和 perf 先看清谁在跑。
date: 2026-10-30
series: linux-app
order: 1
tags: [Linux, 进程, 调度]
---

板端应用常见的问题是「线程开太多，CPU 全在切换」。先观察，再决定拆不拆。

## 看进程

```bash
ps -eo pid,ppid,stat,pcpu,pmem,comm --sort=-pcpu | head
top -H -p $(pidof app)
```

`top -H` 把线程单独列出来，能看出是哪个线程吃满了一个核。

## 线程模型

- 采集、处理、上传用固定数量的线程，不要按任务动态创建；
- 线程间用有界队列，队列满时丢旧帧还是阻塞，要写成配置；
- 实时性要求高的线程，考虑 `SCHED_FIFO` 加 CPU 亲和性，但先测再上。

```c
cpu_set_t set;
CPU_ZERO(&set);
CPU_SET(1, &set);
pthread_setaffinity_np(thread, sizeof(set), &set);
```

## 调度观察

```bash
perf stat -e context-switches,cpu-migrations ./app
perf top -p $(pidof app)
```

上下文切换次数远高于帧率，说明锁或唤醒太频繁。先看是不是条件变量用错，再考虑无锁队列。

## 一条经验

在 ZYNQ 的双核上，两三个工作线程足够跑 1080p 的采集和编码。线程数超过核数之后，收益基本为零，延迟反而更不稳定。
