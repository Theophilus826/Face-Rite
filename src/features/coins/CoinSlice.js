import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../Api";

/* ===============================
   Initial State
================================ */
const initialState = {
  balance: 0,
  history: [],
  status: "idle", // idle | loading | succeeded | failed
  historyStatus: "idle",
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

// ✅ Credit user coins (used in showEndScreen)
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

      /* ================= Fetch Coins ================= */
      .addCase(fetchCoins.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload;
      })

      /* ================= Daily Login ================= */
      .addCase(claimDailyLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload;
      })

      /* ================= Credit Coins ================= */
      .addCase(creditCoins.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload.coins;

        if (action.payload?.transaction) {
          if (!Array.isArray(state.history)) {
            state.history = [];
          }

          state.history.unshift(action.payload.transaction);
        }
      })

      /* ================= Game Win Coins ================= */
      .addCase(creditGameWin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload.coins;

        if (action.payload?.transaction) {
          if (!Array.isArray(state.history)) {
            state.history = [];
          }

          state.history.unshift(action.payload.transaction);
        }
      })

      /* ================= Buy Item ================= */
      .addCase(buyItem.fulfilled, (state, action) => {
  state.status = "succeeded";
  state.balance = action.payload.coins;

  if (Array.isArray(action.payload.history)) {
    state.history = action.payload.history;
  } else if (action.payload.history) {

    if (!Array.isArray(state.history)) {
      state.history = [];
    }

    state.history.unshift(action.payload.history);
  }
})


      /* ================= History ================= */
      .addCase(fetchCoinHistory.pending, (state) => {
        state.historyStatus = "loading";
      })
      .addCase(fetchCoinHistory.fulfilled, (state, action) => {
  state.historyStatus = "succeeded";
  state.history = Array.isArray(action.payload)
    ? action.payload
    : [];
})

      .addCase(fetchCoinHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.error = action.payload;
      })

      /* ================= Global Matchers ================= */

      .addMatcher(
        (action) =>
          action.type.startsWith("coins/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload || action.error.message;
        },
      );
  },
});

export const { resetCoinsState } = coinsSlice.actions;
export default coinsSlice.reducer;
