import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
games: [],
};

const gameSlice = createSlice({
name: "games",
initialState,

reducers: {
/* =====================================================
HOST GAME
===================================================== */
hostGame: {
reducer(state, action) {
state.games.unshift(action.payload);
},


  prepare({
    hostId,
    username,
    amount,
    pot,
    numEnemies,
  }) {
    return {
      payload: {
        id: nanoid(),

        hostId,
        username,

        amount,
        pot,

        numEnemies,

        maxPlayers: 1,
        players: [hostId],

        status: "waiting",

        winner: null,
        result: null,

        startedAt: null,
        finishedAt: null,

        enemies: Array.from(
          { length: numEnemies },
          (_, index) => ({
            id: `enemy_${index + 1}`, // ← matches Babylon
            name: `Enemy ${index + 1}`,
            health: 100,
            alive: true,
          })
        ),

        createdAt: Date.now(),
      },
    };
  },
},

/* =====================================================
   START GAME
===================================================== */
startGame(state, action) {
  const { gameId } = action.payload;

  state.games = state.games.map((game) =>
    game.id === gameId
      ? {
          ...game,
          status: "started",
          startedAt: Date.now(),
        }
      : game
  );
},

/* =====================================================
   ADD TO POT
===================================================== */
addToPot(state, action) {
  const { gameId, amount } = action.payload;

  state.games = state.games.map((game) =>
    game.id === gameId
      ? {
          ...game,
          pot: game.pot + amount,
        }
      : game
  );
},

/* =====================================================
   FINISH GAME
===================================================== */
finishGame(state, action) {
  const {
    gameId,
    winnerId,
    result,
  } = action.payload;

  state.games = state.games.map((game) =>
    game.id === gameId
      ? {
          ...game,
          status: "finished",
          winner: winnerId,
          result,
          finishedAt: Date.now(),
        }
      : game
  );
},


},
});

export const {
hostGame,
startGame,
addToPot,
finishGame,
} = gameSlice.actions;

export default gameSlice.reducer;
