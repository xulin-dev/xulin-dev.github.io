export type Project = {
  name: string;
  meta: string;
  summary: string;
  points: string[];
};

export type Job = {
  period: string;
  title: string;
  org: string;
  summary: string;
  projects: Project[];
  stack: string[];
  current?: boolean;
};

export const jobs: Job[] = [
  {
    period: '2024.03 — 至今',
    title: 'Linux 应用开发工程师',
    org: '某智能装备公司（占位）',
    current: true,
    summary:
      '做 ZYNQ 采集终端上的 Linux 应用：从 PL 侧数据通路、内核驱动接口，到用户态采集、界面和板端运维。平时一半时间写 C++ / Qt，一半时间在串口和示波器前。',
    projects: [
      {
        name: 'ZYNQ-7020 视觉采集盒',
        meta: 'PetaLinux · AXI DMA · Qt',
        summary:
          'PL 侧做图像预处理，PS 侧跑 Linux。应用要稳定拿到连续帧，还要在断网时本地缓存、恢复后补传。',
        points: [
          '用户态用 mmap 映射 DMA 缓冲区，配合双缓冲把采集和编码拆开，避免一帧没处理完就覆盖。',
          '设备树里补 reserved-memory 与 DMA 通道描述，解决启动后第一批描述符地址对不上的问题。',
          '用 V4L2 + dma-buf 把采集链路接进现有框架，把原来各自为政的采集线程收敛成一条管线。',
          '现场问题是 cache 一致性和 32 字节对齐，最后靠一致性映射和日志里的物理地址核对定位。',
        ],
      },
      {
        name: '板端运维与升级',
        meta: 'systemd · A/B 分区 · 日志',
        summary:
          '设备装在现场，没人会去拔电重启。应用自启、崩溃拉起、升级失败回滚，都要能远程说清楚。',
        points: [
          'systemd 单元拆成采集、上传、看门狗三个服务，依赖关系显式写清，启动顺序不再靠 sleep。',
          'A/B 分区升级：新版本写备用槽位，校验通过才切 bootargs，失败自动回到旧槽位。',
          '日志按天切分并限制总量，关键状态另写一份 ring buffer，断电后还能看到最后几百行。',
        ],
      },
    ],
    stack: ['C++', 'Qt', 'PetaLinux', 'Yocto', 'V4L2', 'AXI DMA', 'systemd', 'GDB'],
  },
  {
    period: '2021.07 — 2024.02',
    title: '嵌入式软件工程师',
    org: '某工业电子公司（占位）',
    summary:
      '工业网关上的 Linux 应用与协议对接：串口设备接入、Modbus 转发、配置下发，以及产线工装的小工具。',
    projects: [
      {
        name: '边缘网关数据采集',
        meta: 'ARM Linux · Modbus · epoll',
        summary: '一台网关带几十路串口设备，采集周期从秒级到分钟级不等，配置要能热更新。',
        points: [
          '单线程 epoll 管所有串口 fd，定时任务用 timerfd，避免几十个线程互相抢锁。',
          '协议解析按状态机拆开，粘包、半包和校验失败分别计数，现场用统计判断是线路还是设备问题。',
          '配置热更新采用双缓冲加原子指针切换，读线程不加锁，更新失败保留上一份配置。',
        ],
      },
      {
        name: '产线烧录与自检工装',
        meta: 'Python · 串口 · 交叉编译',
        summary: '产线需要一键烧录、读版本、跑自检并打印结果，操作员不接触命令行。',
        points: [
          '用 Python 写上位机，串口协议和板端共用一份定义，避免两边字段对不上。',
          '交叉编译工具链固化成脚本，sysroot 和库版本跟着工程走，换机器不用重新配环境。',
        ],
      },
    ],
    stack: ['C', 'Python', 'Linux', 'Modbus', 'Buildroot', 'Git', 'Docker'],
  },
];

export const education = {
  period: '2017.09 — 2021.06',
  title: '电子信息工程 · 本科',
  org: '某大学（占位）',
  summary: '课程偏硬件：数字电路、信号与系统、微机原理；毕业设计做的是基于 FPGA 的数据采集。',
};

export const stackGroups = [
  {
    label: '语言',
    items: ['C', 'C++', 'Python', 'Shell', 'CMake'],
  },
  {
    label: '板端与系统',
    items: ['ZYNQ-7000', 'PetaLinux', 'Yocto', 'Buildroot', 'Ubuntu', 'ARM64'],
  },
  {
    label: '内核与接口',
    items: ['设备树', 'AXI DMA', 'V4L2', 'mmap', 'UART / I2C / SPI', 'GPIO'],
  },
  {
    label: '应用与框架',
    items: ['Qt', 'epoll', 'systemd', 'SQLite', 'Modbus', 'MQTT'],
  },
  {
    label: '调试与工具',
    items: ['GDB', 'strace', 'perf', '逻辑分析仪', '示波器', 'Wireshark'],
  },
];
