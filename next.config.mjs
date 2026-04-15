/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // 보안 정책: 개발 모드에서 외부 기기 접속 허용 (루트 레벨)
  allowedDevOrigins: ['localhost:3000', '192.168.0.7:3000', '192.168.2.7:3000']
};

export default nextConfig;
