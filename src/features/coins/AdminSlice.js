import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  creditCoinsAdmin,
  getTransactionsAdmin,
  configureEnemiesAdmin,
  startGameAdmin,
} from "../coins/AdminService";

/* =========================================================
   CREDIT COINS
========================================================= */
export const creditCoins = createAsyncThunk(
  "admin/creditCoins",
  async ({ winnerId, amount, description }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;

      let res;

      if (winnerId === "admin") {
        res = await creditCoinsAdmin({ amount, description }, token);
      } else {
        res = await creditCoinsAdmin(
          { userId: winnerId, amount, description },
          token
        );
      }

      return {
        winnerId,
        coins: res.coins,
        message: `Coins ${amount > 0 ? "credited" : "debited"} successfully`,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Credit/Debit failed"
      );
    }
  }
);

/* =========================================================
   FETCH TRANSACTIONS
========================================================= */
export const fetchTransactions = createAsyncThunk(
  "admin/fetchTransactions",
  async (params = {}, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await getTransactionsAdmin(params, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch transactions"
      );
    }
  }
);

/* =========================================================
   CONFIGURE ENEMIES
========================================================= */
export const configureEnemies = createAsyncThunk(
  "admin/configureEnemies",
  async ({ gameId, numEnemies, positions }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;

      const res = await configureEnemiesAdmin(
        { gameId, numEnemies, positions },
        token
      );

      return {
        gameId,
        enemies: res.enemies,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to configure enemies"
      );
    }
  }
);

/* =========================================================
   START GAME
========================================================= */
export const startGame = createAsyncThunk(
  "admin/startGame",
  async ({ gameId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;

      await startGameAdmin({ gameId }, token);

      return { gameId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to start game"
      );
    }
  }
);

/* =========================================================
   SLICE
========================================================= */
const adminSlice = createSlice({
  name: "admin",
  initialState: {
    isLoading: false,
    isSuccess: false,
    message: "",

    transactions: [],
    loadingTransactions: false,

    configuringEnemies: false,
    startingGame: false,
  },

  reducers: {
    resetAdminState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.message = "";
      state.loadingTransactions = false;
      state.configuringEnemies = false;
      state.startingGame = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= CREDIT COINS ================= */
      .addCase(creditCoins.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(creditCoins.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
      })
      .addCase(creditCoins.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.message = action.payload || "Credit/Debit failed";
      })

      /* ================= FETCH TRANSACTIONS ================= */
      .addCase(fetchTransactions.pending, (state) => {
        state.loadingTransactions = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loadingTransactions = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state) => {
        state.loadingTransactions = false;
      })

      /* ================= CONFIGURE ENEMIES ================= */
      .addCase(configureEnemies.pending, (state) => {
        state.configuringEnemies = true;
      })
      .addCase(configureEnemies.fulfilled, (state) => {
        state.configuringEnemies = false;
        state.message = "Enemies configured successfully 👾";
      })
      .addCase(configureEnemies.rejected, (state, action) => {
        state.configuringEnemies = false;
        state.message = action.payload;
      })

      /* ================= START GAME ================= */
      .addCase(startGame.pending, (state) => {
        state.startingGame = true;
      })
      .addCase(startGame.fulfilled, (state) => {
        state.startingGame = false;
        state.message = "Game started 🚀";
      })
      .addCase(startGame.rejected, (state, action) => {
        state.startingGame = false;
        state.message = action.payload;
      });
  },
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;
