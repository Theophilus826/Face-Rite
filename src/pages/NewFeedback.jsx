import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createFeedback } from "../features/FeedbackSlice";
import { creditCoins } from "../features/coins/CoinSlice.js";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const clubs = [
  { name: "Chelsea", img: "/favicon.ico/chelsea.png" },
  { name: "Barcelona", img: "/favicon.ico/barca.png" },
  { name: "Manchester City", img: "/favicon.ico/mancity.png" },
  { name: "Juventus", img: "/favicon.ico/juventus.png" },
  { name: "Paris Saint-Germain (PSG)", img: "/favicon.ico/psg.png" },
  { name: "Liverpool FC", img: "/favicon.ico/liverpool.png" },
  { name: "AC Milan", img: "/favicon.ico/milan.png" },
  { name: "Bayern Munich", img: "/favicon.ico/bayern.png" },
  { name: "Manchester United", img: "/favicon.ico/man-utd.png" },
];

export default function NewFeedback() {
  const [club, setClub] = useState("");
  const [description, setDescription] = useState("");
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.feedbacks);

  const maxDescriptionLength = 500;
  const winAmount = 10;
  const submit = async (e) => {
    e.preventDefault();

    if (!club || !description) {
      return toast.error("All fields are required");
    }

    if (description.length < 10) {
      return toast.error("Description must be at least 10 characters");
    }

    if (!user || !user.token) {
      return toast.error("You must be logged in to submit feedback");
    }

    try {
      await dispatch(createFeedback({ club, description })).unwrap();

      // Show coin animation
      setShowCoinAnimation(true);

      // Credit +10 coins
      await dispatch(
          creditCoins({ coins: winAmount })
        ).unwrap();
      toast.success("Feedback submitted! 🎉 You earned +10 coins");

      // Hide coin animation after 1.5s
      setTimeout(() => setShowCoinAnimation(false), 1500);

      navigate("/feedbacks");
      setClub("");
      setDescription("");
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast.error(error?.message || error || "Failed to submit feedback");
    }
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow relative"
    >
      <h1 className="text-2xl font-bold mb-4">Create Feedback</h1>

      {/* Club selection */}
      <div className="mb-6">
        <p className="font-semibold mb-2">Select Club</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {clubs.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setClub(item.name)}
              className={`border rounded-xl p-3 flex flex-col items-center gap-2 transition
                                ${
                                  club === item.name
                                    ? "border-black ring-2 ring-black"
                                    : "border-gray-300 hover:border-black"
                                }
                            `}
            >
              <img
                src={item.img}
                alt={item.name}
                className="w-14 h-14 object-contain"
              />
              <span className="text-sm font-medium text-center">
                {item.name}
              </span>
            </button>
          ))}
        </div>
        {!club && (
          <p className="text-sm text-gray-500 mt-2">Please select a club</p>
        )}
      </div>

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

      {/* Submit button */}
      <div className="relative">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded text-white ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"
          }`}
        >
          {isLoading ? "Submitting..." : "Submit Feedback (+10 Coins)"}
        </button>

        {/* Coin animation */}
        {showCoinAnimation && (
          <span className="absolute -top-6 right-4 animate-coin-bounce text-yellow-400 font-bold">
            +10💰
          </span>
        )}
      </div>

      {/* Coin animation keyframes */}
      <style>
        {`
                    @keyframes coin-bounce {
                        0% { transform: translateY(0) scale(1); opacity: 1; }
                        50% { transform: translateY(-20px) scale(1.3); opacity: 1; }
                        100% { transform: translateY(-40px) scale(1); opacity: 0; }
                    }
                    .animate-coin-bounce {
                        animation: coin-bounce 1.5s ease-out forwards;
                    }
                `}
      </style>
    </form>
  );
}
