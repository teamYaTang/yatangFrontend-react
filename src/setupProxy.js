const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://172.30.1.78:8080",
      changeOrigin: true,
    })
  );
};
