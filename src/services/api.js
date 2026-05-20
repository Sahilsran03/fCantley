import axios from "axios";
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  storeAuth
} from "./tokenStorage.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000
});

const pendingGetRequests = new Map();

const getRequestKey = (url, config = {}) => {
  const token = getAccessToken() || "";
  const requestUrl = api.getUri({ ...config, method: "get", url });
  return `${token}:${requestUrl}`;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthStorage();
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh-token`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      storeAuth(response.data);
      originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthStorage();
      return Promise.reject(refreshError);
    }
  }
);

const get = api.get.bind(api);

api.get = (url, config = {}) => {
  if (config.signal) {
    return get(url, config);
  }

  const key = getRequestKey(url, config);
  const pendingRequest = pendingGetRequests.get(key);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = get(url, config).finally(() => {
    pendingGetRequests.delete(key);
  });

  pendingGetRequests.set(key, request);
  return request;
};

export default api;
