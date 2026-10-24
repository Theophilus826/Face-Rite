
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

/* ================= PAYSTACK WALLET FUNDING ================= */

// Initialize Paystack checkout.
// Amount is in naira; the backend converts it to kobo.
const initializePaystackFunding = async (amount) => {
    if (!Number.isSafeInteger(amount) || amount < 100) {
        throw new Error("Minimum wallet funding amount is ₦100.");
    }

    const res = await API.post("/wallet/paystack/fund", { amount });
    const payment = res.data;

    if (
        !payment.success ||
        !payment.authorizationUrl ||
        !payment.reference
    ) {
        throw new Error(
            payment.message || "Unable to initialize Paystack payment."
        );
    }

    return payment;
};

// Initialize payment and redirect the user to Paystack.
const fundWalletWithPaystack = async (amount) => {
    const payment = await initializePaystackFunding(amount);

    window.location.assign(payment.authorizationUrl);

    return payment;
};

// Verify payment after returning from Paystack.
// The backend must verify the transaction with Paystack before
// crediting the user's coins.
const verifyPaystackFunding = async (reference) => {
    if (typeof reference !== "string" || !reference.trim()) {
        throw new Error("Paystack payment reference is required.");
    }

    const res = await API.post("/wallet/paystack/verify", {
        reference: reference.trim(),
    });

    return res.data;
};

/* ================= EXPORTS ================= */
const coinApi = {
    creditCoinsAdmin,
    creditCoins,
    getCoins,
    dailyLogin,
    getHistory,
    purchaseItem,
    transferCoins,
    withdrawCoins,

    // Paystack
    initializePaystackFunding,
    fundWalletWithPaystack,
    verifyPaystackFunding,
};

export default coinApi;
