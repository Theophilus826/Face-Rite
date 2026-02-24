import axios from 'axios';
import API from "../features/Api";

const API_URL = "/users/";

const register = async (userData) => {
  const res = await API.post(API_URL + "register", userData);
  if (res.data?.token) localStorage.setItem("user", JSON.stringify(res.data));
  return res.data;
};

const login = async (userData) => {
  const res = await axios.post(`${API_URL}login`, userData);
  // ✅ Store token for API requests and Socket.IO
  if (res.data?.token) {
    localStorage.setItem("token", res.data.token);
  }
  return res.data;
};

const logout = async () => {
  await API.post(API_URL + "logout");
  localStorage.removeItem("user");
};

const forgotPassword = async (email) => {
  const res = await API.post(API_URL + "forgot-password", { email });
  return res.data;
};

const resetPassword = async (token, password) => {
  const res = await API.put(API_URL + `reset-password/${token}`, { password });
  return res.data;
};

const getMe = async () => {
  const res = await API.get(API_URL + "me"); // token automatically included
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
