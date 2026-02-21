import { createAsyncThunk } from "@reduxjs/toolkit";
import coinService from "../coins/CoinService";

export const purchaseItemThunk = createAsyncThunk(
  "coins/purchaseItem",
  async ({ itemName, cost }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await coinService.purchaseItem(itemName, cost, token);
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);
