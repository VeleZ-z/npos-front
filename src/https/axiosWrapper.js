import axios from "axios";
import { isGuest } from "../utils/session";

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
    // Permitir lectura pública para invitados en endpoints que soportan modo público
    if (!token && isGuest() && config.method?.toLowerCase() === "get") {
      config.headers["X-Guest"] = "1";
    }
    return config;
  },
  (error) => Promise.reject(error)
);




