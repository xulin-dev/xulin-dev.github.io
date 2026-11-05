export type Series = {
  slug: string;
  title: string;
  description: string;
  order: number;
};

export const series: Series[] = [
  {
    slug: 'zynq-bringup',
    title: 'ZYNQ 从板到应用',
    description: '从拿到一块 ZYNQ 开发板开始：启动链、PetaLinux、设备树、DMA，再到把应用交给 systemd 看住。',
    order: 1,
  },
  {
    slug: 'linux-app',
    title: 'Linux 应用开发手册',
    description: '板端应用绕不开的几件事：进程与线程、串口与事件循环、日志与现场保留、交叉编译。',
    order: 2,
  },
];

export function getSeries(slug: string) {
  return series.find((s) => s.slug === slug);
}
