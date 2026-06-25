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
            id: `enemy_${index + 1}`,
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

  const game = state.games.find(
    (g) => g.id === gameId
  );

  if (game) {
    game.status = "started";
    game.startedAt = Date.now();
  }
},

/* =====================================================
   ADD TO POT
===================================================== */
addToPot(state, action) {
  const { gameId, amount } = action.payload;

  const game = state.games.find(
    (g) => g.id === gameId
  );

  if (game) {
    game.pot += amount;
  }
},

/* =====================================================
   FINISH GAME
   result = won | lost | cancelled
===================================================== */
finishGame(state, action) {
  const {
    gameId,
    result,
  } = action.payload;

  const game = state.games.find(
    (g) => g.id === gameId
  );

  if (!game) return;

  game.status = "finished";
  game.result = result;
  game.finishedAt = Date.now();

  if (result === "won") {
    game.winner = game.hostId;
  } else {
    game.winner = null;
  }
},

/* =====================================================
   CANCEL GAME
===================================================== */
cancelGame(state, action) {
  const { gameId } = action.payload;

  const game = state.games.find(
    (g) => g.id === gameId
  );

  if (!game) return;

  game.status = "finished";
  game.result = "cancelled";
  game.winner = null;
  game.finishedAt = Date.now();
},

/* =====================================================
   REMOVE GAME
===================================================== */
removeGame(state, action) {
  const { gameId } = action.payload;

  state.games = state.games.filter(
    (game) => game.id !== gameId
  );
},


},
});

export const {
hostGame,
startGame,
addToPot,
finishGame,
cancelGame,
removeGame,
} = gameSlice.actions;

export default gameSlice.reducer;
