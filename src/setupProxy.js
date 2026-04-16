const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
  const oauthTarget = {
    target: "http://localhost:8080",
    changeOrigin: true,
  };
  app.use("/oauth2", createProxyMiddleware(oauthTarget));
  app.use("/login/oauth2", createProxyMiddleware(oauthTarget));
};
