import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("flexgrade-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("flexgrade-token");
    }

    return Promise.reject(error);
  },
);

export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);
  localStorage.setItem("flexgrade-token", response.data.token);
  return response.data;
}

export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/uploads/analyze", formData);
  return response.data;
}

export async function computeResults(payload) {
  const response = await api.post("/grading/compute", payload);
  return response.data;
}

export async function exportResults(payload) {
  const response = await api.post("/grading/export", payload, {
    responseType: "blob",
  });
  return response.data;
}

export async function saveConfiguration(payload) {
  const response = await api.post("/grading/configurations", payload);
  return response.data;
}

export async function fetchConfigurations() {
  const response = await api.get("/grading/configurations");
  return response.data;
}
