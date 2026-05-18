// src/auth/AuthSlice.js

import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import authService from "./AuthService";

import API from "../features/Api";

/* ================= INITIAL STATE ================= */

const initialState = {
  user:
    JSON.parse(
      localStorage.getItem("user")
    ) || null,

  token:
    localStorage.getItem("token") ||
    null,

  contacts: [],

  mood: null,

  isError: false,
  isSuccess: false,
  isLoading: false,

  message: "",
};

/* ================= HELPERS ================= */

const setPending = (state) => {
  state.isLoading = true;
  state.isError = false;
  state.isSuccess = false;
  state.message = "";
};

const setRejected = (
  state,
  action
) => {
  state.isLoading = false;
  state.isError = true;
  state.message =
    action.payload ||
    "Something went wrong";
};

/* ================= AUTH ================= */

export const registerUser =
  createAsyncThunk(
    "auth/register",
    async (userData, thunkAPI) => {
      try {
        return await authService.register(
          userData
        );
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

export const loginUser =
  createAsyncThunk(
    "auth/login",
    async (userData, thunkAPI) => {
      try {
        return await authService.login(
          userData
        );
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

export const forgotPassword =
  createAsyncThunk(
    "auth/forgotPassword",
    async (identifier, thunkAPI) => {
      try {
        return await authService.forgotPassword(
          identifier
        );
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

export const resetPassword =
  createAsyncThunk(
    "auth/resetPassword",
    async (
      { token, password },
      thunkAPI
    ) => {
      try {
        return await authService.resetPassword(
          token,
          password
        );
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

/* ================= CONTACTS ================= */

export const fetchContacts =
  createAsyncThunk(
    "auth/fetchContacts",
    async (_, thunkAPI) => {
      try {
        return await authService.getContacts();
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

export const addContact =
  createAsyncThunk(
    "auth/addContact",
    async (userId, thunkAPI) => {
      try {
        return await authService.addContact(
          userId
        );
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

/* ================= SEARCH ================= */

export const searchUsers =
  createAsyncThunk(
    "auth/searchUsers",
    async (query, thunkAPI) => {
      try {
        return await authService.searchUsers(
          query
        );
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

/* ================= MOOD ================= */

export const sendMood =
  createAsyncThunk(
    "auth/sendMood",
    async (mood, thunkAPI) => {
      try {
        const { data } =
          await API.post(
            "/users/mood",
            { mood }
          );

        return data.mood || mood;
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.response?.data
            ?.message ||
            error.message
        );
      }
    }
  );

/* ================= SLICE ================= */

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.contacts = [];
      state.mood = null;

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );
    },

    setUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(state.user)
      );
    },
  },

  extraReducers: (builder) => {
    builder

      /* REGISTER */
      .addCase(
        registerUser.pending,
        setPending
      )

      .addCase(
        registerUser.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;

          state.user = action.payload;

          state.token =
            action.payload.token;
        }
      )

      .addCase(
        registerUser.rejected,
        setRejected
      )

      /* LOGIN */
      .addCase(
        loginUser.pending,
        setPending
      )

      .addCase(
        loginUser.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.isSuccess = true;

          state.user = action.payload;

          state.token =
            action.payload.token;
        }
      )

      .addCase(
        loginUser.rejected,
        setRejected
      )

      /* FORGOT PASSWORD */
      .addCase(
        forgotPassword.pending,
        setPending
      )

      .addCase(
        forgotPassword.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.isSuccess = true;

          state.message =
            action.payload?.message ||
            "Reset instructions sent";
        }
      )

      .addCase(
        forgotPassword.rejected,
        setRejected
      )

      /* RESET PASSWORD */
      .addCase(
        resetPassword.pending,
        setPending
      )

      .addCase(
        resetPassword.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.isSuccess = true;

          state.message =
            action.payload?.message ||
            "Password reset successful";
        }
      )

      .addCase(
        resetPassword.rejected,
        setRejected
      )

      /* CONTACTS */
      .addCase(
        fetchContacts.pending,
        setPending
      )

      .addCase(
        fetchContacts.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.isSuccess = true;

          state.contacts =
            action.payload.users || [];
        }
      )

      .addCase(
        fetchContacts.rejected,
        setRejected
      )

      /* ADD CONTACT */
      .addCase(
        addContact.pending,
        setPending
      )

      .addCase(
        addContact.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.isSuccess = true;

          state.message =
            action.payload.message;
        }
      )

      .addCase(
        addContact.rejected,
        setRejected
      )

      /* SEND MOOD */
      .addCase(
        sendMood.pending,
        setPending
      )

      .addCase(
        sendMood.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.isSuccess = true;

          state.mood =
            action.payload;
        }
      )

      .addCase(
        sendMood.rejected,
        setRejected
      );
  },
});

export const {
  reset,
  logout,
  setUser,
} = authSlice.actions;

export default authSlice.reducer;