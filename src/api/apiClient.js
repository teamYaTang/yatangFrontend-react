import axios from "axios";

const apiClient = axios.create({
  // http://백엔드ip:포트번호

  baseURL: "http://localhost:3000",
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
