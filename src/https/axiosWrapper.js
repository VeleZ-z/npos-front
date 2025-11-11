import axios from "axios";

export const axiosWrapper = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor para actualizar/eliminar el header Authorization en cada petición
axiosWrapper.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers && config.headers.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);




