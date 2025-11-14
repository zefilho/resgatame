import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is required to allow the Next.js dev server to accept requests from
    // the Firebase Studio development environment.
    allowedDevOrigins: [
        '6000-firebase-studio-1749052338704.cluster-4xpux6pqdzhrktbhjf2cumyqtg.cloudworkstations.dev',
        '9000-firebase-studio-1749052338704.cluster-4xpux6pqdzhrktbhjf2cumyqtg.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
