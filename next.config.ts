const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: isDevelopment
              ? "no-referrer-when-downgrade"
              : "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
