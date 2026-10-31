/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: false,
      },
      {
        source: "/mail",
        destination: "/dashboard/mail",
        permanent: false,
      },
      {
        source: "/chat",
        destination: "/dashboard/chat",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
