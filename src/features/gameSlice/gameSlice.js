import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";

/* =========================================================
   ASYNC THUNK: HOST GAME (POST TO BACKEND)
========================================================= */
export const hostGameAsync = createAsyncThunk(
  "games/hostGameAsync",
  async ({ userId, pot }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pot }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to host game");
      return data.game; // Backend game object with real id
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* =========================================================
   INITIAL STATE
========================================================= */
const initialState = {
  games: [],
  loading: false,
  error: null,
};

/* =========================================================
   SLICE
========================================================= */
const gameSlice = createSlice({
  name: "games",
  initialState,
  reducers: {
    /* ========================= HOST GAME (LOCAL FEEDBACK) ========================= */
    hostGame: {
      reducer(state, action) {
        state.games.unshift(action.payload);
      },
      prepare({ hostId, amount }) {
        return {
          payload: {
            id: nanoid(),           // Temporary local id
            hostId,
            amount,
            maxPlayers: 1,
            players: [hostId],
            status: "waiting",
            winner: null,
            pot: amount,
            enemies: [],
            createdAt: Date.now(),
          },
        };
      },
    },

    /* ========================= START GAME ========================= */
    startGame(state, action) {
      const { gameId } = action.payload;
      state.games = state.games.map((game) =>
        game.id === gameId ? { ...game, status: "started" } : game
      );
    },

    /* ========================= ADD TO POT ========================= */
    addToPot(state, action) {
      const { gameId, amount } = action.payload;
      state.games = state.games.map((game) =>
        game.id === gameId ? { ...game, pot: game.pot + amount } : game
      );
    },

    /* ========================= FINISH GAME ========================= */
    finishGame(state, action) {
      const { gameId, winnerId } = action.payload;
      state.games = state.games.map((game) =>
        game.id === gameId ? { ...game, status: "finished", winner: winnerId } : game
      );
    },
  },

  /* ========================= EXTRA REDUCERS FOR ASYNC THUNK ========================= */
  extraReducers: (builder) => {
    builder
      .addCase(hostGameAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(hostGameAsync.fulfilled, (state, action) => {
        state.loading = false;

        const backendGame = action.payload;

        // Replace any local temporary game with backend game (match by temp hostId + amount if needed)
        const tempIndex = state.games.findIndex(
          (g) => g.hostId === backendGame.userId && g.pot === backendGame.pot && g.status === "waiting"
        );
        if (tempIndex !== -1) {
          state.games[tempIndex] = backendGame;
        } else {
          state.games.unshift(backendGame);
        }
      })
      .addCase(hostGameAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to host game";
      });
  },
});

/* =========================================================
   EXPORTS
========================================================= */
export const { hostGame, startGame, addToPot, finishGame } = gameSlice.actions;
export default gameSlice.reducer;