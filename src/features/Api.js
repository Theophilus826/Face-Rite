import axios from 'axios';

// ===============================
// Helpers
// ===============================
const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
};

// ===============================
// Axios Instance
// ===============================
const API = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        'https://swordgame-5.onrender.com/api',
    withCredentials: true,
});

// ===============================
// Request Interceptor
// ===============================
API.interceptors.request.use(
    (config) => {
        const user = getStoredUser();

        if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }

        if (import.meta.env.DEV) {
            console.log('➡️ Request:', `${config.baseURL}${config.url}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ===============================
// Response Interceptor
// ===============================
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (import.meta.env.DEV) {
            console.error("⛔ API Error:", error.response || error.message);
        }

        if (error.response?.status === 401) {
            console.warn('⛔ Unauthorized – logging out');

            localStorage.removeItem('user');

            if (!window.location.pathname.includes('/login')) {
                window.location.replace('/login');
            }
        }

        return Promise.reject(error);
    }
);

export default API;