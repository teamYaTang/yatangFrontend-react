import axios from "axios";

const apiClient = axios.create({
  baseURL: "backendURL",
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
