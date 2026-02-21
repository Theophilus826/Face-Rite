// src/features/feedback/useFeedbacks.js
import { useDispatch, useSelector } from 'react-redux';
import {
    getFeedbacks,
    getFeedback,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    resetFeedbackState,
} from './feedbackSlice';
import { useEffect } from 'react';

export const useFeedbacks = () => {
    const dispatch = useDispatch();

    const feedbackState = useSelector((state) => state.feedbacks);
    const { feedbacks, feedback, isLoading, isError, isSuccess, message } = feedbackState;

    // Fetch all feedbacks
    const fetchFeedbacks = (query) => dispatch(getFeedbacks(query));

    // Fetch single feedback
    const fetchFeedback = (id) => dispatch(getFeedback(id));

    // Create new feedback
    const addFeedback = (feedbackData) => dispatch(createFeedback(feedbackData));

    // Update feedback
    const editFeedback = (id, status) => dispatch(updateFeedback({ id, status }));

    // Delete feedback
    const removeFeedback = (id) => dispatch(deleteFeedback(id));

    // Reset state
    const resetFeedbacks = () => dispatch(resetFeedbackState());

    return {
        feedbacks,
        feedback,
        isLoading,
        isError,
        isSuccess,
        message,
        fetchFeedbacks,
        fetchFeedback,
        addFeedback,
        editFeedback,
        removeFeedback,
        resetFeedbacks,
    };
};
