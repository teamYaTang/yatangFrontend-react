import axios from "axios";
import { shouldRefreshAccessToken } from "../utils/jwt";

const apiClient = axios.create({
  // 프록시를 통해 /api로 요청하면 자동으로 백엔드로 전달됩니다
  baseURL: "/api",
});

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const setAuthorization = (token) => {
  if (!token) {
    delete apiClient.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["Authorization"];
    return;
  }

  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    setAuthorization(accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  setAuthorization(null);
};

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (accessToken && config.headers) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error("refresh token이 없습니다.");
  }

  const response = await axios.post("/api/auth/refresh", { refreshToken });
  setAuthTokens(response.data);
  return response.data.accessToken;
};

/** access가 없거나 만료·임박이면 refresh로 갱신. 만료 직후에도 API가 게스트 분기로 빠지지 않게 합니다. */
export const ensureAccessToken = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  if (!shouldRefreshAccessToken()) return true;
  try {
    await refreshAccessToken();
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    if (
      ![401, 403].includes(status) ||
      !originalRequest ||
      originalRequest._retry ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout") ||
      url.includes("/login")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const accessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
