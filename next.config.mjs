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
      // The template's customers screen became the product's customers directory.
      {
        source: "/dashboard/users",
        destination: "/dashboard/customers",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
