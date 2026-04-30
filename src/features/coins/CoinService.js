import API from "../Api";

/* ================= ADMIN ================= */
const creditCoinsAdmin = async (data, token) => {
    const res = await API.post("/coins/admin/update", data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

/* ================= USER ================= */
const creditCoins = async (coins, token) => {
    const res = await API.post(
        "/coins/credit",
        { coins },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

const getCoins = async (token) => {
    const res = await API.get("/coins/balance", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

const dailyLogin = async (token) => {
    const res = await API.post(
        "/coins/daily-reward",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

const getHistory = async (token) => {
    const res = await API.get("/coins/history", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

const purchaseItem = async (itemName, cost, token) => {
    const res = await API.post(
        "/coins/purchase",
        { itemName, cost },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

/* ================= USER TO USER TRANSFER ================= */
const transferCoins = async (toUserId, coins, token, description) => {
    const res = await API.post(
        "/coins/transfer",
        { toUserId, amount: coins, description },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

/* ================= WITHDRAW ================= */
const withdrawCoins = async ({ amount, bankName, accountNumber }) => {
  const res = await API.post("/withdrawals/request", {
    amount,
    bankName,
    accountNumber,
  });

  return res.data;
};

export default {
    creditCoinsAdmin,
    creditCoins,
    getCoins,
    dailyLogin,
    getHistory,
    purchaseItem,
    transferCoins, // ✅ new function
    withdrawCoins,
};