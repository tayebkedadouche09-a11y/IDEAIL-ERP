import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const stored = sessionStorage.getItem("ideail_auth");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch (error) {
      console.error("Unable to attach auth token", error);
    }
  }
  return config;
});

export default api;