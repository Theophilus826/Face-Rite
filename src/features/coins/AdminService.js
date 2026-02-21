// src/features/coins/AdminService.js
import API from "../Api";

// -------------------- CREDIT / DEBIT COINS --------------------
export const creditCoinsAdmin = async (data, token) => {
  const res = await API.put("/admin/credit-coins", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// -------------------- FETCH TRANSACTIONS --------------------
export const getTransactionsAdmin = async (params = {}, token) => {
  // Build query string from params
  const query = new URLSearchParams(params).toString();
  const res = await API.get(`/admin/transactions?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data; // should return an array of transactions
};
export const configureEnemiesAdmin = async (data, token) => {
  const res = await axios.post("/api/game/configure-enemies", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const startGameAdmin = async (data, token) => {
  const res = await axios.post("/api/game/start", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
