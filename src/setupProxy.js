const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
  /**
   * OAuth: Spring이 카카오에 넣는 redirect_uri의 호스트가 브라우저(예: localhost:3000)와 같게 나가도록
   * Forwarded / X-Forwarded-* 전달 (KOE006: 등록한 URI와 요청 redirect_uri 불일치 방지)
   */
  const oauthTarget = {
    target: "http://localhost:8080",
    changeOrigin: true,
    xfwd: true,
    onProxyReq(proxyReq, req) {
      const host = req.headers.host;
      if (host) {
        proxyReq.setHeader("X-Forwarded-Host", host);
        const hostPart = host.split(":")[0];
        const portPart = host.includes(":") ? host.split(":").pop() : "";
        if (portPart && portPart !== hostPart) {
          proxyReq.setHeader("X-Forwarded-Port", portPart);
        }
      }
      const proto = (req.headers["x-forwarded-proto"] || "http").toString().split(",")[0].trim() || "http";
      proxyReq.setHeader("X-Forwarded-Proto", proto);
      if (host) {
        proxyReq.setHeader("Forwarded", `proto=${proto};host=${host}`);
      }
    },
  };
  app.use("/oauth2", createProxyMiddleware(oauthTarget));
  app.use("/login/oauth2", createProxyMiddleware(oauthTarget));
};
