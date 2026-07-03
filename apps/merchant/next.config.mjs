/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const apiParsed = new URL(apiUrl);

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@mirakart/ui", "@mirakart/types"],
  images: {
    remotePatterns: [
      // Legacy direct-MinIO pattern (local dev)
      {
        protocol: process.env.NEXT_PUBLIC_MINIO_USE_SSL === "true" ? "https" : "http",
        hostname: process.env.NEXT_PUBLIC_MINIO_HOST ?? "localhost",
      },
      // Production: images served via api subdomain /storage/ proxy
      {
        protocol: apiParsed.protocol.replace(":", ""),
        hostname: apiParsed.hostname,
        pathname: "/storage/**",
      },
    ],
  },
  compress: true,
};

export default nextConfig;
