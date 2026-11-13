import axios from "axios";

// Buat instance Axios dengan konfigurasi dasar
// Prioritaskan environment variable VITE_API_BASE_URL.
// Jika tidak disetel: gunakan http://localhost:3000/api saat mode development, dan /api saat production build.
const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:3000/api" : "/api"),
});

// Gunakan interceptor untuk menambahkan token JWT ke setiap permintaan secara otomatis
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem("token");

    // Jika token ada, tambahkan ke header Authorization
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Lakukan sesuatu jika ada error pada permintaan
    return Promise.reject(error);
  },
);

export default apiClient;
