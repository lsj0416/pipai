import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SVG를 <img>로 직접 사용 (next/image 최적화 미적용)
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
