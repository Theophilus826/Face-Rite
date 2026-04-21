import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./AuthService";
import API from "../features/Api"; // ✅ FIXED

// ================= INITIAL STATE =================
const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  mood: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// ================= HELPERS =================
const setPending = (state) => {
  state.isLoading = true;
  state.isError = false;
  state.isSuccess = false;
  state.message = "";
};

const setRejected = (state, action) => {
  state.isLoading = false;
  state.isError = true;
  state.message = action.payload;
};

// ================= ASYNC THUNKS =================

// ✅ REGISTER
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Registration failed"
      );
    }
  }
);

// ✅ LOGIN (identifier supported already)
export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }
);

// ✅ FORGOT PASSWORD (UPDATED → identifier)
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (identifier, thunkAPI) => {
    try {
      return await authService.forgotPassword(identifier);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Request failed"
      );
    }
  }
);

// ✅ RESET PASSWORD
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, thunkAPI) => {
    try {
      return await authService.resetPassword(token, password);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Reset failed"
      );
    }
  }
);

// ✅ SEND MOOD
export const sendMood = createAsyncThunk(
  "auth/sendMood",
  async (mood, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.token;

      if (!token) throw new Error("User not authenticated");

      const { data } = await API.post(
        "/mood",
        { mood },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return data.mood || mood;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to send mood"
      );
    }
  }
);

// ================= SLICE =================
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
      state.mood = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },

    // ✅ update user (e.g avatar)
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },

  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registerUser.pending, setPending)
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(registerUser.rejected, setRejected)

      // LOGIN
      .addCase(loginUser.pending, setPending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.token = action.payload.token;

        localStorage.setItem("user", JSON.stringify(action.payload));
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginUser.rejected, setRejected)

      // FORGOT PASSWORD
      .addCase(forgotPassword.pending, setPending)
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message =
          action.payload?.message || "Reset instructions sent";
      })
      .addCase(forgotPassword.rejected, setRejected)

      // RESET PASSWORD
      .addCase(resetPassword.pending, setPending)
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message =
          action.payload?.message || "Password reset successful";
      })
      .addCase(resetPassword.rejected, setRejected)

      // SEND MOOD
      .addCase(sendMood.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(sendMood.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.mood = action.payload;
      })
      .addCase(sendMood.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, logout, setUser } = authSlice.actions;
export default authSlice.reducer;