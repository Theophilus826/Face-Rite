import axios from "axios";

// ===============================
// Helpers
// ===============================
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// ===============================
// Axios Instance
// ===============================
export const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://swordgame-5.onrender.com/api",
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
      console.log("➡️ Request:", `${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error),
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
      console.warn("⛔ Unauthorized – logging out");
      localStorage.removeItem("user");

      if (!window.location.pathname.includes("/login")) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

// ===============================
// Post Helpers
// =============================
export const uploadMedia = async (postId, file) => {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  formData.append("file", file);

  const fileType = file.type.startsWith("image")
    ? "image"
    : file.type.startsWith("video")
    ? "video"
    : null;

  if (!fileType) throw new Error("Unsupported file type");

  formData.append("type", fileType);

  const res = await API.post(`/post/${postId}/media`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// React to a post
export const reactToPost = async (postId, type) => {
  if (!["like", "love"].includes(type))
    throw new Error("Invalid reaction type");

  // Backend expects POST /post/:id/react
  const res = await API.post(`/post/${postId}/react`, { type });
  return res.data;
};

// Fetch all posts
export const fetchPosts = async () => {
  const res = await API.get("/post");
  return res.data.posts || [];
};
// ===============================
// Deposit / Wallet Helpers
// ===============================

// Generate Virtual Deposit Account
export const generateDepositAccount = async () => {
  const res = await API.post("/wallet/deposit-account");
  return res.data;
};

// Get User Wallet Balance
export const getWalletBalance = async () => {
  const res = await API.get("/wallet/balance");
  return res.data;
};

// Get Deposit History
export const getDepositHistory = async () => {
  const res = await API.get("/wallet/deposits");
  return res.data;
};

// Verify Deposit
export const verifyDeposit = async (reference) => {
  const res = await API.post("/wallet/verify-deposit", { reference });
  return res.data;
};

export default API;
