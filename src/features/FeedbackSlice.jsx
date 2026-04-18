import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ===============================
// API Base URL
// ===============================
const API_URL = '/api/feedbacks';

// ===============================
// Helper: Auth config
// ===============================
const getAuthConfig = (thunkAPI) => {
    const token = thunkAPI.getState().auth?.user?.token;
    console.log("Token from Redux:", token); // Debug

    if (!token) {
        throw new Error('Not authorized');
    }

    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
};

// ===============================
// Async Thunks
// ===============================

// GET ALL feedbacks
export const getFeedbacks = createAsyncThunk(
    'feedbacks/getAll',
    async (query = {}, thunkAPI) => {
        try {
            const params = new URLSearchParams(query).toString();
            const config = getAuthConfig(thunkAPI);
            const res = await axios.get(params ? `${API_URL}?${params}` : API_URL, config);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// GET ONE feedback
export const getFeedback = createAsyncThunk(
    'feedbacks/getOne',
    async (id, thunkAPI) => {
        try {
            const config = getAuthConfig(thunkAPI);
            const res = await axios.get(`${API_URL}/${id}`, config);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// CREATE feedback
export const createFeedback = createAsyncThunk(
    'feedbacks/create',
    async (feedbackData, thunkAPI) => {
        try {
            const config = getAuthConfig(thunkAPI);
            const res = await axios.post(API_URL, feedbackData, config);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// UPDATE feedback
export const updateFeedback = createAsyncThunk(
    'feedbacks/update',
    async ({ id, data }, thunkAPI) => {
        try {
            const config = getAuthConfig(thunkAPI);
            const res = await axios.put(`${API_URL}/${id}`, data, config);
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// DELETE feedback
export const deleteFeedback = createAsyncThunk(
    'feedbacks/delete',
    async (id, thunkAPI) => {
        try {
            const config = getAuthConfig(thunkAPI);
            await axios.delete(`${API_URL}/${id}`, config);
            return id;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// ===============================
// Slice Helpers
// ===============================
const handlePending = (state) => {
    state.isLoading = true;
    state.isError = false;
    state.isSuccess = false;
    state.message = '';
};

const handleRejected = (state, action) => {
    state.isLoading = false;
    state.isError = true;
    state.isSuccess = false;
    state.message = action.payload || 'Something went wrong';
};

// ===============================
// Feedback Slice
// ===============================
const feedbackSlice = createSlice({
    name: 'feedbacks',
    initialState: {
        feedbacks: [],
        feedback: null,
        isLoading: false,
        isError: false,
        isSuccess: false,
        message: '',
    },
    reducers: {
        resetFeedbackState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // GET ALL
            .addCase(getFeedbacks.pending, handlePending)
            .addCase(getFeedbacks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.feedbacks = action.payload;
            })
            .addCase(getFeedbacks.rejected, handleRejected)

            // GET ONE
            .addCase(getFeedback.pending, handlePending)
            .addCase(getFeedback.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.feedback = action.payload;
            })
            .addCase(getFeedback.rejected, handleRejected)

            // CREATE
            .addCase(createFeedback.pending, handlePending)
            .addCase(createFeedback.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.feedbacks.unshift(action.payload);
            })
            .addCase(createFeedback.rejected, handleRejected)

            // UPDATE
            .addCase(updateFeedback.pending, handlePending)
            .addCase(updateFeedback.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.feedbacks = state.feedbacks.map(fb =>
                    fb._id === action.payload._id ? action.payload : fb
                );
            })
            .addCase(updateFeedback.rejected, handleRejected)

            // DELETE
            .addCase(deleteFeedback.pending, handlePending)
            .addCase(deleteFeedback.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.feedbacks = state.feedbacks.filter(fb => fb._id !== action.payload);
            })
            .addCase(deleteFeedback.rejected, handleRejected);
    },
});

export const { resetFeedbackState } = feedbackSlice.actions;
export default feedbackSlice.reducer;
