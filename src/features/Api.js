
import axios from "axios";

// ===============================
// HELPERS
// ===============================
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// ===============================
// AXIOS INSTANCE
// ===============================
export const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://swordgame-5.onrender.com/api",
  withCredentials: true,
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(
        "➡️ Request:",
        `${config.baseURL}${config.url}`
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error(
        "⛔ API Error:",
        error.response || error.message
      );
    }

    if (error.response?.status === 401) {
      console.warn("Unauthorized request");

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

// ===============================
// POST HELPERS
// ===============================

// Upload post media
export const uploadMedia = async (postId, file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const formData = new FormData();
  formData.append("file", file);

  const fileType = file.type.startsWith("image")
    ? "image"
    : file.type.startsWith("video")
      ? "video"
      : null;

  if (!fileType) {
    throw new Error("Unsupported file type");
  }

  formData.append("type", fileType);

  const res = await API.post(
    `/post/${postId}/media`,
    formData
  );

  return res.data;
};

// React to a post
export const reactToPost = async (postId, type) => {
  if (!["like", "love"].includes(type)) {
    throw new Error("Invalid reaction type");
  }

  const res = await API.post(
    `/post/${postId}/react`,
    { type }
  );

  return res.data;
};

// Fetch all posts
export const fetchPosts = async () => {
  const res = await API.get("/post");
  return res.data.posts || [];
};

// ===============================
// WALLET / DEPOSIT HELPERS
// ===============================

// Generate virtual deposit account
export const generateDepositAccount = async (data) => {
  const res = await API.post(
    "/wallet/deposit-account",
    data
  );

  return res.data;
};

// Get wallet balance
export const getWalletBalance = async () => {
  const res = await API.get("/wallet/balance");
  return res.data;
};

// Get deposit history
export const getDepositHistory = async () => {
  const res = await API.get("/wallet/deposit-history");
  return res.data;
};

// Verify existing bank deposit
export const verifyDeposit = async (reference) => {
  if (!reference?.trim()) {
    throw new Error("Deposit reference is required");
  }

  const res = await API.post(
    "/wallet/verify-deposit",
    { reference }
  );

  return res.data;
};

// ===============================
// PAYSTACK LIVE WALLET FUNDING
// Conversion: ₦1 = 1 coin
// ===============================

// Initialize Paystack wallet funding
export const initializeWalletFunding = async (amount) => {
  if (
    !Number.isSafeInteger(amount) ||
    amount < 100
  ) {
    throw new Error(
      "Enter a whole naira amount of at least ₦100"
    );
  }

  const res = await API.post(
    "/wallet/paystack/fund",
    { amount }
  );

  const payment = res.data;

  if (
    !payment.success ||
    !payment.authorizationUrl ||
    !payment.reference
  ) {
    throw new Error(
      "Unable to initialize Paystack payment"
    );
  }

  return payment;
};

// Redirect user to Paystack checkout
export const fundWalletWithPaystack = async (amount) => {
  const payment = await initializeWalletFunding(amount);

  window.location.assign(payment.authorizationUrl);
};

// Verify payment after checkout
export const verifyWalletFunding = async (reference) => {
  if (
    typeof reference !== "string" ||
    !reference.trim()
  ) {
    throw new Error(
      "Paystack payment reference is required"
    );
  }

  const res = await API.post(
    "/wallet/paystack/verify",
    { reference }
  );

  return res.data;
};

// Get Paystack funding history
// Requires GET /wallet/paystack/history on your backend.
export const getPaystackFundingHistory = async () => {
  const res = await API.get(
    "/wallet/paystack/history"
  );

  return res.data;
};

// ===============================
// CALL HELPERS
// ===============================

// Start call
export const startCall = async ({
  receiverId,
  type = "voice",
}) => {
  const res = await API.post("/call/start", {
    receiverId,
    type,
  });

  return res.data;
};

// Accept call
export const acceptCall = async ({ callId }) => {
  const res = await API.post("/call/accept", {
    callId,
  });

  return res.data;
};

// Reject call
export const rejectCall = async ({ callId }) => {
  const res = await API.post("/call/reject", {
    callId,
  });

  return res.data;
};

// Cancel call
export const cancelCall = async ({ callId }) => {
  const res = await API.post("/call/cancel", {
    callId,
  });

  return res.data;
};

// End call
export const endCall = async ({ callId }) => {
  const res = await API.post("/call/end", {
    callId,
  });

  return res.data;
};

// Send SDP offer
export const sendOffer = async ({ callId, offer }) => {
  const res = await API.post("/call/offer", {
    callId,
    offer,
  });

  return res.data;
};

// Send SDP answer
export const sendAnswer = async ({ callId, answer }) => {
  const res = await API.post("/call/answer", {
    callId,
    answer,
  });

  return res.data;
};

// Send ICE candidate
export const sendIceCandidate = async ({
  callId,
  candidate,
}) => {
  const body = {
    callId,
    candidate,
  };

  if (import.meta.env.DEV) {
    console.log("POST /call/ice", body);
  }

  const res = await API.post("/call/ice", body);

  return res.data;
};

// ===============================
// WEBRTC ICE SERVERS
// ===============================
const defaultIceServers = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
    ],
  },
];

export const getIceServers = async () => {
  const endpoints = [
    "/ice/ice-servers",
    "/ice",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await API.get(endpoint);

      if (import.meta.env.DEV) {
        console.log(
          `Loaded ICE servers from ${endpoint}`
        );
      }

      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(
          `ICE endpoint not found: ${endpoint}`
        );

        continue;
      }

      console.error(
        "Failed to load ICE servers:",
        err.response?.data || err.message
      );

      throw err;
    }
  }

  console.warn(
    "Falling back to default ICE servers."
  );

  return {
    success: false,
    iceServers: defaultIceServers,
  };
};

// ===============================
// DEFAULT EXPORT
// ===============================
export default API;
