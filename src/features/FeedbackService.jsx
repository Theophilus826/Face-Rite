// src/features/feedback/feedbackService.js
import axios from 'axios';

const API_URL = '/api/feedbacks';

// Get token from Redux state
const getConfig = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// ===============================
// Get all feedbacks
// ===============================
const getFeedbacks = async (token, query = {}) => {
    const params = new URLSearchParams(query).toString();
    const response = await axios.get(`${API_URL}?${params}`, getConfig(token));
    return response.data;
};

// ===============================
// Get single feedback
// ===============================
const getFeedback = async (token, id) => {
    const response = await axios.get(`${API_URL}/${id}`, getConfig(token));
    return response.data;
};

// ===============================
// Create feedback
// ===============================
const createFeedback = async (token, feedbackData) => {
    const response = await axios.post(API_URL, feedbackData, getConfig(token));
    return response.data;
};

// ===============================
// Update feedback
// ===============================
const updateFeedback = async (token, id, status) => {
    const response = await axios.put(`${API_URL}/${id}`, { status }, getConfig(token));
    return response.data;
};

// ===============================
// Delete feedback
// ===============================
const deleteFeedback = async (token, id) => {
    await axios.delete(`${API_URL}/${id}`, getConfig(token));
    return id;
};

const feedbackService = {
    getFeedbacks,
    getFeedback,
    createFeedback,
    updateFeedback,
    deleteFeedback,
};

export default feedbackService;
