import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./AuthService";

// ================= LOAD USER FROM LOCALSTORAGE =================
// const user = JSON.parse(localStorage.getItem("user"));

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

// Register
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

// Login
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

// Forgot Password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkAPI) => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Request failed"
      );
    }
  }
);

// Reset Password
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

// Send Mood
// ✅ Send Mood to backend/admin
export const sendMood = createAsyncThunk(
  "auth/sendMood",
  async (mood, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.token;

      if (!token) throw new Error("User not authenticated");

      // Use API instance for consistent baseURL & headers
      const { data } = await API.post(
        "/mood",
        { mood },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Return the mood to store in Redux
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
    // ✅ Update user (e.g., avatar)
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, setPending)
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(registerUser.rejected, setRejected)

      // Login
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

      // Forgot Password
      .addCase(forgotPassword.pending, setPending)
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload?.message || "Password reset link sent";
      })
      .addCase(forgotPassword.rejected, setRejected)

      // Reset Password
      .addCase(resetPassword.pending, setPending)
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload?.message || "Password reset successful";
      })
      .addCase(resetPassword.rejected, setRejected)

      // Send Mood
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