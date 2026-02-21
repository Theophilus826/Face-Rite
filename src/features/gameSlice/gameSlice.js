import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  games: [],
};

const gameSlice = createSlice({
  name: "games",
  initialState,

  reducers: {
    /* ========================= HOST GAME ========================= */
    hostGame: {
      reducer(state, action) {
        state.games.unshift(action.payload);
      },

      prepare({ hostId, amount }) {
        return {
          payload: {
            id: nanoid(),
            hostId,
            amount,
            maxPlayers: 1,
            players: [hostId],

            status: "waiting",      // ✅ IMPORTANT CHANGE
            winner: null,

            pot: amount,
            enemies: [],            // ✅ matches backend
            createdAt: Date.now(),
          },
        };
      },
    },

    /* ========================= START GAME ========================= */
    startGame(state, action) {
      const { gameId } = action.payload;

      state.games = state.games.map((game) => {
        if (game.id === gameId) {
          return { ...game, status: "started" };
        }
        return game;
      });
    },

    /* ========================= ADD TO POT ========================= */
    addToPot(state, action) {
      const { gameId, amount } = action.payload;

      state.games = state.games.map((game) => {
        if (game.id === gameId) {
          return {
            ...game,
            pot: game.pot + amount,
          };
        }
        return game;
      });
    },

    /* ========================= FINISH GAME ========================= */
    finishGame(state, action) {
      const { gameId, winnerId } = action.payload;

      state.games = state.games.map((game) => {
        if (game.id === gameId) {
          return {
            ...game,
            status: "finished",
            winner: winnerId,
          };
        }
        return game;
      });
    },
  },
});

export const {
  hostGame,
  startGame,    // ✅ NEW
  addToPot,     // ✅ FIXED EXPORT
  finishGame,
} = gameSlice.actions;

export default gameSlice.reducer;
