import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFeedback, updateFeedback, deleteFeedback } from '../features/FeedbackSlice';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function FeedbackDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { feedback, isLoading } = useSelector((state) => state.feedbacks);
    const { user } = useSelector((state) => state.auth);

    const [status, setStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        dispatch(getFeedback(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (feedback) setStatus(feedback.status || 'open');
    }, [feedback]);

    const handleStatusChange = async (newStatus) => {
        setIsUpdating(true);
        try {
            await dispatch(updateFeedback({ id, data: { status: newStatus } })).unwrap();
            toast.success('Status updated!');
            setStatus(newStatus);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await dispatch(deleteFeedback(id)).unwrap();
            toast.success('Feedback deleted!');
            navigate('/feedbacks');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete feedback');
        }
    };

    if (isLoading || !feedback) return <p className="text-center">Loading feedback...</p>;

    return (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
            <h1 className="text-2xl font-bold mb-2">{feedback.subject}</h1>
            <p className="text-gray-600 mb-4">{feedback.message}</p>
            <p className="text-sm text-gray-500 mb-2">Category: {feedback.category}</p>

            <div className="mb-4 flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                {user?.role === 'admin' ? (
                    <>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isUpdating}
                            className="p-2 border rounded"
                        >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="closed">Closed</option>
                        </select>
                        {isUpdating && <span className="text-sm text-gray-500">Updating...</span>}
                    </>
                ) : (
                    <span className="capitalize">{status}</span>
                )}
            </div>

            {/* Admin-only delete button */}
            {user?.role === 'admin' && (
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mb-4"
                >
                    Delete Feedback
                </button>
            )}

            {feedback.file && (
                <div className="mb-4">
                    <span className="font-semibold">Attachment:</span>{' '}
                    {feedback.file.endsWith('.png') ||
                        feedback.file.endsWith('.jpg') ||
                        feedback.file.endsWith('.jpeg') ? (
                        <img src={feedback.file} alt="Attachment" className="mt-2 max-h-60 rounded" />
                    ) : (
                        <a href={feedback.file} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            View File
                        </a>
                    )}
                </div>
            )}

            <div className="mt-6 text-gray-500 text-sm">
                <p>Created At: {new Date(feedback.createdAt).toLocaleString()}</p>
                {feedback.updatedAt && <p>Last Updated: {new Date(feedback.updatedAt).toLocaleString()}</p>}
            </div>
        </div>
    );
}
