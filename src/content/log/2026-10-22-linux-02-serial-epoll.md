---
title: 02 串口与 epoll：一个线程管多路设备
description: 串口不是阻塞读就是开线程？用 O_NONBLOCK + epoll + timerfd，一个循环全接住。
date: 2026-10-22
series: linux-app
order: 2
tags: [Linux, 串口, epoll]
---

网关类设备常有十几路串口，每路一个线程会带来大量上下文切换。把 fd 设为非阻塞，交给一个 epoll 循环。

## 打开串口

```c
int fd = open("/dev/ttyS3", O_RDWR | O_NOCTTY | O_NONBLOCK);
struct termios tio;
tcgetattr(fd, &tio);
cfmakeraw(&tio);
cfsetispeed(&tio, B115200);
cfsetospeed(&tio, B115200);
tio.c_cflag |= CLOCAL | CREAD;
tcsetattr(fd, TCSANOW, &tio);
```

`cfmakeraw` 关掉回显和行缓冲。工业设备常用 8N1，校验位按协议另设。

## epoll 循环

```c
struct epoll_event ev = { .events = EPOLLIN, .data.fd = fd };
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &ev);

while (running) {
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
    for (int i = 0; i < n; i++) {
        if (events[i].data.fd == timer_fd)
            on_timer();
        else
            read_serial(events[i].data.fd);
    }
}
```

## 粘包与半包

串口是字节流，一次 `read` 不保证读到完整帧。按协议用状态机拆：

```c
while (pos < len) {
    if (buf[pos] != 0xAA) { pos++; continue; }
    if (len - pos < 4) break;              /* 等更多数据 */
    uint16_t flen = buf[pos + 2] | (buf[pos + 3] << 8);
    if (len - pos < 4 + flen + 2) break;   /* 帧未收全 */
    handle_frame(buf + pos, flen);
    pos += 4 + flen + 2;
}
```

没消费完的尾部要 `memmove` 到缓冲区开头，别直接丢掉。

## 超时与重连

串口设备可能掉线。`read` 返回 0 或 `EIO` 时，关掉 fd、从 epoll 删除，按退避时间重开。重连逻辑放在同一个循环里，用 `timerfd` 触发，不要再起线程。
