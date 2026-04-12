import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFeedback, updateFeedback } from '../features/FeedbackSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function EditFeedback() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { feedback, isLoading } = useSelector((state) => state.feedbacks);

    const [club, setClub] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('new');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const maxDescriptionLength = 500;

    useEffect(() => {
        dispatch(getFeedback(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (feedback) {
            setClub(feedback.club || '');
            setDescription(feedback.description || '');
            setStatus(feedback.status || 'new');
        }
    }, [feedback]);

    const submit = async (e) => {
        e.preventDefault();

        if (!club || !description) {
            return toast.error('All fields are required');
        }

        if (description.length < 10) {
            return toast.error('Description must be at least 10 characters');
        }

        setIsSubmitting(true);

        try {
            await dispatch(
                updateFeedback({
                    id,
                    data: {
                        club,
                        description,
                        status,
                    },
                })
            ).unwrap();

            toast.success('Feedback updated successfully!');
            navigate(`/feedback/${id}`);
        } catch (error) {
            console.error(error);
            toast.error(error || 'Failed to update feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <p className="text-center mt-10">Loading feedback...</p>;
    }

    return (
        <form
            onSubmit={submit}
            className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow"
        >
            <h1 className="text-2xl font-bold mb-4">Edit Feedback</h1>

            {/* Club */}
            <select
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="w-full p-3 border rounded mb-4"
            >
                <option value="">Select Games</option>
                <option value="Call of Duty">Call of Duty</option>
                <option value="Act or War">Act or War</option>
                <option value="Car Race">Car Race</option>
                <option value="Real Punching">Real Punching</option>
                <option value="Real league Football">
                    Real league Football
                </option>
                <option value="Spirit Sword">Spirit Sword</option>
                <option value="Grand War">Grand War</option>
                <option value="Ludo Game">Ludo Game</option>
                <option value="Subway">Subway</option>
            </select>

            {/* Status */}
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 border rounded mb-4"
            >
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
            </select>

            {/* Description */}
            <textarea
                placeholder="Describe the issue..."
                value={description}
                onChange={(e) =>
                    e.target.value.length <= maxDescriptionLength &&
                    setDescription(e.target.value)
                }
                className="w-full p-3 border rounded mb-1 min-h-[140px]"
            />

            <p className="text-right text-sm text-gray-500 mb-4">
                {description.length}/{maxDescriptionLength}
            </p>

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded text-white ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800'
                    }`}
            >
                {isSubmitting ? 'Updating...' : 'Update Feedback'}
            </button>
        </form>
    );
}
