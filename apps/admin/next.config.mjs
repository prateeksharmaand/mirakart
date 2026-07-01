/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@mirakart/ui", "@mirakart/types"],
  images: {
    remotePatterns: [
      {
        protocol: process.env.NEXT_PUBLIC_MINIO_USE_SSL === "true" ? "https" : "http",
        hostname: process.env.NEXT_PUBLIC_MINIO_HOST ?? "localhost",
      },
    ],
  },
  compress: true,
};

export default nextConfig;
