import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SVG를 <img>로 직접 사용 (next/image 최적화 미적용)
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
