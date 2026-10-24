
import { createAsyncThunk } from "@reduxjs/toolkit";
import coinService from "../coins/CoinService";

export const purchaseItemThunk = createAsyncThunk(
  "coins/purchaseItem",
  async ({ itemName, cost }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;

      if (!token) {
        return thunkAPI.rejectWithValue(
          "Please log in to purchase an item."
        );
      }

      if (!itemName || !Number.isFinite(cost) || cost <= 0) {
        return thunkAPI.rejectWithValue(
          "Invalid item name or purchase cost."
        );
      }

      return await coinService.purchaseItem(
        itemName,
        cost,
        token
      );
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to purchase item."
      );
    }
  }
);
