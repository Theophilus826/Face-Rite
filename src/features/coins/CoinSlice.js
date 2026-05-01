import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "../Api";

/* ===============================
   Initial State
================================ */
const initialState = {
  balance: 0,
  history: [],

  // separate statuses (IMPORTANT FIX)
  fetchStatus: "idle",
  historyStatus: "idle",
  withdrawStatus: "idle",
  transferStatus: "idle",
  actionStatus: "idle",

  error: null,
};

/* ===============================
   Helpers
================================ */
const getAuthHeader = (thunkAPI) => {
  const token = thunkAPI.getState().auth.user?.token;
  return { headers: { Authorization: `Bearer ${token}` } };
};

/* ===============================
   Thunks
================================ */

// Fetch current coin balance
export const fetchCoins = createAsyncThunk(
  "coins/fetchCoins",
  async (_, thunkAPI) => {
    const res = await API.get("/coins/balance", getAuthHeader(thunkAPI));
    return res.data.coins;
  },
);

// Claim daily login reward
export const claimDailyLogin = createAsyncThunk(
  "coins/claimDailyLogin",
  async (_, thunkAPI) => {
    const res = await API.post(
      "/coins/daily-reward",
      {},
      getAuthHeader(thunkAPI),
    );
    return res.data.coins;
  },
);

// Credit user coins (manual or game reward)
export const creditCoins = createAsyncThunk(
  "coins/creditCoins",
  async ({ coins }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/credit",
        { coins },
        getAuthHeader(thunkAPI),
      );
      return res.data; // { coins, transaction }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Failed to credit coins",
      );
    }
  },
);

// Buy item (spend coins)
export const buyItem = createAsyncThunk(
  "coins/buyItem",
  async ({ itemName, cost }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/purchase",
        { itemName, cost },
        getAuthHeader(thunkAPI),
      );
      return res.data; // { coins, history }
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

// Fetch coin history
export const fetchCoinHistory = createAsyncThunk(
  "coins/fetchCoinHistory",
  async (_, thunkAPI) => {
    const res = await API.get("/coins/history", getAuthHeader(thunkAPI));
    return res.data.history;
  },
);

// Credit game win coins
export const creditGameWin = createAsyncThunk(
  "coins/creditGameWin",
  async ({ coins }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/game-win",
        { coins },
        getAuthHeader(thunkAPI),
      );
      return res.data; // { coins, transaction }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

// ================= USER TO USER TRANSFER =================
export const transferCoins = createAsyncThunk(
  "coins/transferCoins",
  async ({ toUserId, coins, description }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/transfer",
        {
          toUserId,
          amount: coins, // ✅ FIXED
          description,
        },
        getAuthHeader(thunkAPI),
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);
// ================= WITHDRAW COINS =================
export const withdrawCoins = createAsyncThunk(
  "coins/withdrawCoins",
  async ({ amount, bankName, accountNumber }, thunkAPI) => {
    try {
      const res = await API.post(
        "/withdrawals/request",
        { amount, bankName, accountNumber },
        getAuthHeader(thunkAPI),
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Withdrawal failed",
      );
    }
  },
);

/* ===============================
   Slice
================================ */
const coinsSlice = createSlice({
  name: "coins",
  initialState,
  reducers: {
    resetCoinsState: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder

      /* ================= FETCH COINS ================= */
      .addCase(fetchCoins.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchCoins.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.balance = action.payload;
      })
      .addCase(fetchCoins.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error =
          action.payload || action.error?.message || "Failed to fetch coins";
      })

      /* ================= DAILY LOGIN ================= */
      .addCase(claimDailyLogin.fulfilled, (state, action) => {
        state.balance = action.payload;
      })

      /* ================= CREDIT COINS ================= */
      .addCase(creditCoins.fulfilled, (state, action) => {
        state.balance = action.payload.coins;

        if (action.payload?.transaction) {
          state.history.unshift(action.payload.transaction);
        }
      })

      /* ================= GAME WIN ================= */
      .addCase(creditGameWin.fulfilled, (state, action) => {
        state.balance = action.payload.coins;

        if (action.payload?.transaction) {
          state.history.unshift(action.payload.transaction);
        }
      })

      /* ================= BUY ITEM ================= */
      .addCase(buyItem.fulfilled, (state, action) => {
        state.balance = action.payload.coins;

        if (Array.isArray(action.payload.history)) {
          state.history = action.payload.history;
        } else if (action.payload.history) {
          state.history.unshift(action.payload.history);
        }
      })

      /* ================= HISTORY ================= */
      .addCase(fetchCoinHistory.pending, (state) => {
        state.historyStatus = "loading";
      })
      .addCase(fetchCoinHistory.fulfilled, (state, action) => {
        state.historyStatus = "succeeded";
        state.history = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCoinHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.error =
          action.payload || action.error?.message || "History fetch failed";
      })

      /* ================= TRANSFER ================= */
      .addCase(transferCoins.fulfilled, (state, action) => {
        state.balance = action.payload.coins;

        if (action.payload?.transaction) {
          state.history.unshift(action.payload.transaction);
        }
      })

      /* ================= WITHDRAW ================= */
      .addCase(withdrawCoins.pending, (state) => {
        state.withdrawStatus = "loading";
        state.error = null;
      })
      .addCase(withdrawCoins.fulfilled, (state, action) => {
        state.withdrawStatus = "succeeded";

        state.balance = action.payload.balance ?? state.balance;

        if (action.payload?.withdrawal) {
          state.history.unshift({
            type: "WITHDRAWAL_REQUEST",
            amount: action.payload.withdrawal.amount,
            status: action.payload.withdrawal.status,
            createdAt: action.payload.withdrawal.createdAt,
          });
        }
      })
      .addCase(withdrawCoins.rejected, (state, action) => {
        state.withdrawStatus = "failed";
        state.error =
          action.payload || action.error?.message || "Withdrawal failed";
      })

      /* ================= GLOBAL SAFETY ================= */
      .addMatcher(
        (action) =>
          action.type.startsWith("coins/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.error =
            action.payload || action.error?.message || "Something went wrong";
        },
      );
  },
});

export const { resetCoinsState } = coinsSlice.actions;
export default coinsSlice.reducer;
