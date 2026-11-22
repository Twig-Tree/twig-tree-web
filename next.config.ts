const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig = {
  /*
  개발 표시의 기본 위치(왼쪽 아래)는 메뉴바의 프로필 메뉴를, 오른쪽 아래는 TanStack Query devtools 버튼을 가린다. 개발 서버에서만 보이는 표시라 배포 화면에는 영향이 없다.
  */
  devIndicators: {
    position: "top-right",
  },
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
