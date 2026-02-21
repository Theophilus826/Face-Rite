// src/api/axios.js
import axios from 'axios';

// ===============================
// Create Axios instance
// ===============================
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://swordgame-5.onrender.com/api',
    withCredentials: true,
});

// ===============================
// Request Interceptor
// Attach JWT automatically
// ===============================
API.interceptors.request.use(
    (config) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));

            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (err) {
            console.warn('Invalid user data in localStorage');
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
// Handle auth errors globally
// ===============================
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('⛔ Unauthorized – logging out');

            localStorage.removeItem('user');

            // Optional: redirect to login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default API;
