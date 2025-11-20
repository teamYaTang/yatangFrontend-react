import axios from "axios";

const apiClient = axios.create({
  // 프록시를 통해 /api로 요청하면 자동으로 백엔드로 전달됩니다
  baseURL: "/api",
});

// token 필요없을 듯..
export const setAuthorization = (token) => {
  axios.defaults.headers.common["Authorization"] = `bearer ${token}`;
};

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken && config.headers) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

export default apiClient;
