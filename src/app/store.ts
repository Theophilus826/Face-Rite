import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/AuthSlice";
import feedbackReducer from "../features/FeedbackSlice";
import coinSliceReducer from "../features/coins/CoinSlice";
import gameReducer from "../features/gameSlice/gameSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feedbacks: feedbackReducer,
    coins: coinSliceReducer,
    games: gameReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;