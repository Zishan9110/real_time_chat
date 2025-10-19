import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`, // uses .env
  withCredentials: true,
});

export default api;
