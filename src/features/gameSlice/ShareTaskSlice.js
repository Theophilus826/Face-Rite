// src/features/ShareTaskSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import ShareTaskService from "./ShareTaskService";

/* =========================================
   INITIAL STATE
========================================= */

const initialState = {
  tasks: [],
  myTasks: [],
  progress: [],

  isLoading: false,
  isSuccess: false,
  isError: false,

  message: "",
};

/* =========================================
   HELPERS
========================================= */

const pending = (state) => {
  state.isLoading = true;
  state.isError = false;
  state.isSuccess = false;
  state.message = "";
};

const rejected = (state, action) => {
  state.isLoading = false;
  state.isError = true;
  state.message =
    action.payload || "Something went wrong";
};

/* =========================================
   USER
========================================= */

export const fetchTasks = createAsyncThunk(
  "shareTasks/fetchTasks",
  async (_, thunkAPI) => {
    try {
      const res = await ShareTaskService.getTasks();
      return res.data.tasks;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const fetchMyTasks = createAsyncThunk(
  "shareTasks/fetchMyTasks",
  async (_, thunkAPI) => {
    try {
      const res = await ShareTaskService.getMyTasks();
      return res.data.tasks;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

/* =========================================
   ADMIN
========================================= */

export const createTask = createAsyncThunk(
  "shareTasks/createTask",
  async (task, thunkAPI) => {
    try {
      const res = await ShareTaskService.createTask(task);
      return res.data.task;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const updateTask = createAsyncThunk(
  "shareTasks/updateTask",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await ShareTaskService.updateTask(
        id,
        data
      );

      return res.data.task;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const deleteTask = createAsyncThunk(
  "shareTasks/deleteTask",
  async (id, thunkAPI) => {
    try {
      await ShareTaskService.deleteTask(id);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const fetchProgress = createAsyncThunk(
  "shareTasks/fetchProgress",
  async (taskId, thunkAPI) => {
    try {
      const res =
        await ShareTaskService.getProgress(taskId);

      return res.data.progress;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const rewardUser = createAsyncThunk(
  "shareTasks/rewardUser",
  async ({ taskId, userId }, thunkAPI) => {
    try {
      const res =
        await ShareTaskService.rewardUser(
          taskId,
          userId
        );

      return {
        ...res.data,
        userId,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

/* =========================================
   SLICE
========================================= */

const ShareTaskSlice = createSlice({
  name: "shareTasks",

  initialState,

  reducers: {
    resetShareTasks: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },

  extraReducers: (builder) => {
    builder

      /* FETCH TASKS */

      .addCase(fetchTasks.pending, pending)

      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.tasks = action.payload;
      })

      .addCase(fetchTasks.rejected, rejected)

      /* MY TASKS */

      .addCase(fetchMyTasks.pending, pending)

      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myTasks = action.payload;
      })

      .addCase(fetchMyTasks.rejected, rejected)

      /* CREATE */

      .addCase(createTask.pending, pending)

      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        state.tasks.unshift(action.payload);
      })

      .addCase(createTask.rejected, rejected)

      /* UPDATE */

      .addCase(updateTask.pending, pending)

      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        state.tasks = state.tasks.map((task) =>
          task._id === action.payload._id
            ? action.payload
            : task
        );
      })

      .addCase(updateTask.rejected, rejected)

      /* DELETE */

      .addCase(deleteTask.pending, pending)

      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        state.tasks = state.tasks.filter(
          (task) => task._id !== action.payload
        );
      })

      .addCase(deleteTask.rejected, rejected)

      /* PROGRESS */

      .addCase(fetchProgress.pending, pending)

      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        state.progress = action.payload;
      })

      .addCase(fetchProgress.rejected, rejected)

      /* REWARD */

      .addCase(rewardUser.pending, pending)

      .addCase(rewardUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        state.progress = state.progress.map((item) =>
          item.user._id === action.payload.userId
            ? {
                ...item,
                rewarded: true,
              }
            : item
        );
      })

      .addCase(rewardUser.rejected, rejected);
  },
});

export const { resetShareTasks } =
  ShareTaskSlice.actions;

export default ShareTaskSlice.reducer;