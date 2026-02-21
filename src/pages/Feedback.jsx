import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { createFeedback } from "../features/FeedbackSlice";
import { creditCoins } from "../features/coins/CoinSlice.js";

export default function NewFeedback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [club, setClub] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const winAmount = 10;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!club || !description) {
      alert("Club and description are required");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1️⃣ Submit feedback
      await dispatch(
        createFeedback({ club, description })
      ).unwrap();

      // 2️⃣ Credit +10 coins
      await dispatch(
          creditCoins({ coins: winAmount })
        ).unwrap();


      alert("Feedback submitted! 🎉 You earned +10 coins");

      setClub("");
      setDescription("");
      navigate("/Feedbacks");

    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert(`Failed to submit feedback: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-6">New Feedback</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Club"
          value={club}
          onChange={(e) => setClub(e.target.value)}
          className="border p-3 rounded-lg"
          required
        />

        <textarea
          placeholder="Feedback"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-3 rounded-lg"
          rows={5}
          required
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isSubmitting
            ? "Submitting..."
            : "Submit Feedback (+10 Coins)"}
        </button>
      </form>
    </div>
  );
}
