import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  admin: {
    id: "admin",
    name: "House",
    coins: 100000   // starting bank
  }
};

const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {

    creditAdmin(state, action) {
      state.admin.coins += action.payload;
    },

    debitAdmin(state, action) {
      state.admin.coins -= action.payload;
    }

  }
});

export const { creditAdmin, debitAdmin } = systemSlice.actions;
export default systemSlice.reducer;
