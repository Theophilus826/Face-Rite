// src/auth/AuthService.js

import API from "../features/Api";

const API_URL = "/users/";

/* ================= TOKEN HELPERS ================= */

const saveAuth = (data) => {
  if (data?.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );
  }
};

const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/* ================= REGISTER ================= */

const register = async (userData) => {
  const res = await API.post(
    API_URL + "register",
    userData
  );

  saveAuth(res.data);

  return res.data;
};

/* ================= LOGIN ================= */

const login = async ({
  identifier,
  password,
}) => {
  const res = await API.post(
    API_URL + "login",
    {
      identifier,
      password,
    }
  );

  saveAuth(res.data);

  return res.data;
};

/* ================= LOGOUT ================= */

const logout = async () => {
  try {
    await API.post(API_URL + "logout");
  } finally {
    clearAuth();
  }
};

/* ================= FORGOT PASSWORD ================= */

const forgotPassword = async (
  identifier
) => {
  const res = await API.post(
    API_URL + "forgot-password",
    {
      identifier,
    }
  );

  return res.data;
};

/* ================= RESET PASSWORD ================= */

const resetPassword = async (
  token,
  password
) => {
  const res = await API.put(
    API_URL + `reset-password/${token}`,
    {
      password,
    }
  );

  return res.data;
};

/* ================= GET CURRENT USER ================= */

const getMe = async () => {
  const res = await API.get(
    API_URL + "me"
  );

  return res.data;
};

/* ================= CONTACTS ================= */

const getContacts = async () => {
  const res = await API.get(
    API_URL + "contacts"
  );

  return res.data;
};

const addContact = async (userId) => {
  const res = await API.post(
    API_URL + "contacts/add",
    {
      userId,
    }
  );

  return res.data;
};

/* ================= SEARCH USERS ================= */

const searchUsers = async (query) => {
  const res = await API.get(
    API_URL + `search?q=${encodeURIComponent(
      query
    )}`
  );

  return res.data;
};

/* ================= UPDATE AVATAR ================= */

const updateAvatar = async (
  userId,
  file
) => {
  const formData = new FormData();

  formData.append("file", file);

  const res = await API.put(
    API_URL + `${userId}/avatar`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  // update local user
  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  const updatedUser = {
    ...currentUser,
    avatar: res.data.avatar,
  };

  localStorage.setItem(
    "user",
    JSON.stringify(updatedUser)
  );

  return res.data;
};

/* ================= EXPORT ================= */

export default {
  register,
  login,
  logout,

  forgotPassword,
  resetPassword,

  getMe,

  getContacts,
  addContact,
  searchUsers,

  updateAvatar,
};