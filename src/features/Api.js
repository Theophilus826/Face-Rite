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
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      console.warn("Unauthorized request");

      // only clear, DO NOT reload immediately
      localStorage.removeItem("user");
      localStorage.removeItem("token");
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
export const generateDepositAccount = async (data) => {
  const res = await API.post("/wallet/deposit-account", data);
  return res.data;
};

// Get User Wallet Balance
export const getWalletBalance = async () => {
  const res = await API.get("/wallet/balance");
  return res.data;
};

// Get Deposit History
export const getDepositHistory = async () => {
  const res = await API.get("/wallet/deposit-history");
  return res.data;
};

// Verify Deposit
export const verifyDeposit = async (reference) => {
  const res = await API.post("/wallet/verify-deposit", { reference });
  return res.data;
};

// ===============================
// Call Helpers
// ===============================
// Start Call
export const startCall = async ({ receiverId, type = "voice" }) => {
  const res = await API.post("/call/start", {
    receiverId,
    type,
  });

  return res.data;
};

// Accept Call
export const acceptCall = async ({ callId }) => {
  const res = await API.post("/call/accept", { callId });
  return res.data;
};

// Reject Call
export const rejectCall = async ({ callId }) => {
  const res = await API.post("/call/reject", { callId });
  return res.data;
};

// Cancel Call
export const cancelCall = async ({ callId }) => {
  const res = await API.post("/call/cancel", { callId });
  return res.data;
};

// End Call
export const endCall = async ({ callId }) => {
  const res = await API.post("/call/end", { callId });
  return res.data;
};

// Send SDP Offer
export const sendOffer = async ({ callId, offer }) => {
  const res = await API.post("/call/offer", {
    callId,
    offer,
  });

  return res.data;
};

// Send SDP Answer
export const sendAnswer = async ({ callId, answer }) => {
  const res = await API.post("/call/answer", {
    callId,
    answer,
  });

  return res.data;
};

// Send ICE Candidate
export const sendIceCandidate = async ({ callId, candidate }) => {
  const res = await API.post("/call/ice", {
    callId,
    candidate,
  });

  return res.data;
};

export default API;
