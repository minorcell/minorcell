import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // Cache Components 的 RSC 分段机制与静态导出的 payload 路径不一致（上游 issue #85374），
  // 客户端导航会拿到 HTML 而非 RSC 流导致白屏。禁用后回退到旧式 payload 路径。
  cacheComponents: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
