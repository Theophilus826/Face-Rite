import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/AuthSlice";
import feedbackReducer from "../features/FeedbackSlice";
import coinsReducer from "../features/coins/CoinSlice";
import gameReducer from "../features/gameSlice/gameSlice";
import shareTasksReducer from "../features/gameSlice/ShareTaskSlice";
import callReducer from "../features/callSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feedbacks: feedbackReducer,
    coins: coinsReducer,
    games: gameReducer,
    shareTasks: shareTasksReducer,
    call: callReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;