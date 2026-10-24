
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "../Api";

/* ===============================
   Initial State
================================ */
const initialState = {
  balance: 0,
  history: [],

  fetchStatus: "idle",
  historyStatus: "idle",
  withdrawStatus: "idle",
  transferStatus: "idle",
  actionStatus: "idle",
  paystackStatus: "idle",

  error: null,
  paystackError: null,
};

/* ===============================
   Helpers
================================ */
const getAuthHeader = (thunkAPI) => {
  const token = thunkAPI.getState().auth.user?.token;

  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
};

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

/* ===============================
   FETCH COINS
================================ */
export const fetchCoins = createAsyncThunk(
  "coins/fetchCoins",
  async (_, thunkAPI) => {
    try {
      const res = await API.get(
        "/coins/balance",
        getAuthHeader(thunkAPI),
      );

      return res.data.coins;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch coins"),
      );
    }
  },
);

/* ===============================
   DAILY LOGIN REWARD
================================ */
export const claimDailyLogin = createAsyncThunk(
  "coins/claimDailyLogin",
  async (_, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/daily-reward",
        {},
        getAuthHeader(thunkAPI),
      );

      return res.data.coins;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to claim daily reward"),
      );
    }
  },
);

/* ===============================
   CREDIT COINS
================================ */
export const creditCoins = createAsyncThunk(
  "coins/creditCoins",
  async ({ coins }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/credit",
        { coins },
        getAuthHeader(thunkAPI),
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to credit coins"),
      );
    }
  },
);

/* ===============================
   PURCHASE ITEM
================================ */
export const buyItem = createAsyncThunk(
  "coins/buyItem",
  async ({ itemName, cost }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/purchase",
        { itemName, cost },
        getAuthHeader(thunkAPI),
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to purchase item"),
      );
    }
  },
);

/* ===============================
   COIN HISTORY
================================ */
export const fetchCoinHistory = createAsyncThunk(
  "coins/fetchCoinHistory",
  async (_, thunkAPI) => {
    try {
      const res = await API.get(
        "/coins/history",
        getAuthHeader(thunkAPI),
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch coin history"),
      );
    }
  },
);

/* ===============================
   GAME WIN REWARD
================================ */
export const creditGameWin = createAsyncThunk(
  "coins/creditGameWin",
  async ({ coins }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/game-win",
        { coins },
        getAuthHeader(thunkAPI),
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to credit game winnings"),
      );
    }
  },
);

/* ===============================
   USER-TO-USER TRANSFER
================================ */
export const transferCoins = createAsyncThunk(
  "coins/transferCoins",
  async ({ toUserId, coins, description }, thunkAPI) => {
    try {
      const res = await API.post(
        "/coins/transfer",
        {
          toUserId,
          amount: coins,
          description,
        },
        getAuthHeader(thunkAPI),
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Coin transfer failed"),
      );
    }
  },
);

/* ===============================
   WITHDRAW COINS
================================ */
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
        getErrorMessage(err, "Withdrawal failed"),
      );
    }
  },
);

/* ===============================
   PAYSTACK: INITIALIZE FUNDING
================================ */
// Amount is in naira. Backend should convert to kobo.
export const initializePaystackFunding = createAsyncThunk(
  "coins/initializePaystackFunding",
  async ({ amount }, thunkAPI) => {
    if (!Number.isSafeInteger(amount) || amount < 100) {
      return thunkAPI.rejectWithValue(
        "Minimum wallet funding amount is ₦100.",
      );
    }

    try {
      const res = await API.post(
        "/wallet/paystack/fund",
        { amount },
        getAuthHeader(thunkAPI),
      );

      const payment = res.data;

      if (
        !payment?.success ||
        !payment?.authorizationUrl ||
        !payment?.reference
      ) {
        return thunkAPI.rejectWithValue(
          payment?.message || "Unable to initialize Paystack payment",
        );
      }

      return payment;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Could not start Paystack payment"),
      );
    }
  },
);

/* ===============================
   PAYSTACK: VERIFY FUNDING
================================ */
export const verifyPaystackFunding = createAsyncThunk(
  "coins/verifyPaystackFunding",
  async ({ reference }, thunkAPI) => {
    if (typeof reference !== "string" || !reference.trim()) {
      return thunkAPI.rejectWithValue(
        "Paystack payment reference is required.",
      );
    }

    try {
      const res = await API.post(
        "/wallet/paystack/verify",
        { reference: reference.trim() },
        getAuthHeader(thunkAPI),
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Payment verification failed"),
      );
    }
  },
);

/* ===============================
   SLICE
================================ */
const coinsSlice = createSlice({
  name: "coins",
  initialState,

  reducers: {
    resetCoinsState: () => ({ ...initialState }),

    clearCoinError: (state) => {
      state.error = null;
    },

    clearPaystackError: (state) => {
      state.paystackError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* FETCH BALANCE */
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
          action.payload || action.error.message || "Failed to fetch coins";
      })

      /* DAILY REWARD */
      .addCase(claimDailyLogin.fulfilled, (state, action) => {
        state.balance = action.payload;
      })

      /* MANUAL CREDIT */
      .addCase(creditCoins.fulfilled, (state, action) => {
        if (typeof action.payload?.coins === "number") {
          state.balance = action.payload.coins;
        }

        if (action.payload?.transaction) {
          state.history.unshift(action.payload.transaction);
        }
      })

      /* GAME WIN */
      .addCase(creditGameWin.fulfilled, (state, action) => {
        if (typeof action.payload?.coins === "number") {
          state.balance = action.payload.coins;
        }

        if (action.payload?.transaction) {
          state.history.unshift(action.payload.transaction);
        }
      })

      /* PURCHASE */
      .addCase(buyItem.fulfilled, (state, action) => {
        if (typeof action.payload?.coins === "number") {
          state.balance = action.payload.coins;
        }

        if (Array.isArray(action.payload?.history)) {
          state.history = action.payload.history;
        } else if (action.payload?.history) {
          state.history.unshift(action.payload.history);
        }
      })

      /* HISTORY */
      .addCase(fetchCoinHistory.pending, (state) => {
        state.historyStatus = "loading";
      })
      .addCase(fetchCoinHistory.fulfilled, (state, action) => {
        state.historyStatus = "succeeded";
        state.history = Array.isArray(action.payload)
          ? action.payload
          : Array.isArray(action.payload?.history)
            ? action.payload.history
            : [];
      })
      .addCase(fetchCoinHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.error =
          action.payload || action.error.message || "History fetch failed";
      })

      /* TRANSFER */
      .addCase(transferCoins.pending, (state) => {
        state.transferStatus = "loading";
      })
      .addCase(transferCoins.fulfilled, (state, action) => {
        state.transferStatus = "succeeded";

        if (typeof action.payload?.coins === "number") {
          state.balance = action.payload.coins;
        }

        if (action.payload?.transaction) {
          state.history.unshift(action.payload.transaction);
        }
      })
      .addCase(transferCoins.rejected, (state, action) => {
        state.transferStatus = "failed";
        state.error =
          action.payload || action.error.message || "Transfer failed";
      })

      /* WITHDRAWAL */
      .addCase(withdrawCoins.pending, (state) => {
        state.withdrawStatus = "loading";
        state.error = null;
      })
      .addCase(withdrawCoins.fulfilled, (state, action) => {
        state.withdrawStatus = "succeeded";

        if (typeof action.payload?.balance === "number") {
          state.balance = action.payload.balance;
        }

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
          action.payload || action.error.message || "Withdrawal failed";
      })

      /* PAYSTACK INITIALIZATION */
      .addCase(initializePaystackFunding.pending, (state) => {
        state.paystackStatus = "loading";
        state.paystackError = null;
      })
      .addCase(initializePaystackFunding.fulfilled, (state, action) => {
        state.paystackStatus = "checkout_ready";

        // The component performs the redirect after dispatching this thunk.
        // Do not navigate from a Redux reducer.
      })
      .addCase(initializePaystackFunding.rejected, (state, action) => {
        state.paystackStatus = "failed";
        state.paystackError =
          action.payload ||
          action.error.message ||
          "Could not start Paystack payment";
      })

      /* PAYSTACK VERIFICATION */
      .addCase(verifyPaystackFunding.pending, (state) => {
        state.paystackStatus = "verifying";
        state.paystackError = null;
      })
      .addCase(verifyPaystackFunding.fulfilled, (state, action) => {
        state.paystackStatus = "succeeded";

        const result = action.payload;

        // Update balance only if the backend returns a confirmed balance.
        const balance = result?.coins ?? result?.balance;

        if (typeof balance === "number") {
          state.balance = balance;
        }

        if (result?.transaction) {
          state.history.unshift(result.transaction);
        }
      })
      .addCase(verifyPaystackFunding.rejected, (state, action) => {
        state.paystackStatus = "failed";
        state.paystackError =
          action.payload ||
          action.error.message ||
          "Payment verification failed";
      })

      /* GLOBAL REJECTION HANDLING */
      .addMatcher(
        (action) =>
          action.type.startsWith("coins/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          // Keep Paystack errors separate from general wallet errors.
          if (
            action.type === initializePaystackFunding.rejected.type ||
            action.type === verifyPaystackFunding.rejected.type
          ) {
            return;
          }

          state.error =
            action.payload ||
            action.error?.message ||
            "Something went wrong";
        },
      );
  },
});

export const {
  resetCoinsState,
  clearCoinError,
  clearPaystackError,
} = coinsSlice.actions;

export default coinsSlice.reducer;
