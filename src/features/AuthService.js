import API from "../features/Api";

const API_URL = "/users/";

// ================= REGISTER =================
const register = async (userData) => {
  const res = await API.post(API_URL + "register", userData);

  if (res.data?.token) {
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data));
  }

  return res.data;
};

// ================= LOGIN (email OR phone) =================
const login = async ({ identifier, password }) => {
  const res = await API.post(API_URL + "login", {
    identifier,
    password,
  });

  if (res.data?.token) {
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data));
  }

  return res.data;
};

// ================= LOGOUT =================
const logout = async () => {
  await API.post(API_URL + "logout");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

// ================= FORGOT PASSWORD (email OR phone) =================
const forgotPassword = async (identifier) => {
  const res = await API.post(API_URL + "forgot-password", {
    identifier,
  });
  return res.data;
};

// ================= RESET PASSWORD =================
const resetPassword = async (token, password) => {
  const res = await API.put(API_URL + `reset-password/${token}`, {
    password,
  });
  return res.data;
};

// ================= GET CURRENT USER =================
const getMe = async () => {
  const res = await API.get(API_URL + "me");
  return res.data;
};

export default {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};