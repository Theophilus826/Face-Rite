import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createFeedback } from "../features/FeedbackSlice";
import { creditCoins } from "../features/coins/CoinSlice.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const clubs = [
  { name: "Call of Duty", img: "/favicon.ico/Call of Duty.jpg" },
  { name: "Act of War", img: "/favicon.ico/Art of War.jpg" },
  { name: "Car Race", img: "/favicon.ico/Car race.jpg" },
  { name: "Real Punching", img: "/multpunch.jpg" },
  { name: "Real league Football", img: "/multRball.jpg" },
  { name: "Spirit Sword", img: "/multA.jpg" },
  { name: "Grand War", img: "/multGra.jpg" },
  { name: "Ludo Game", img: "/favicon.ico/Ludo.jpg" },
  { name: "Subway", img: "/favicon.ico/Subway.jpg" },
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
      return toast.error("You must be logged in");
    }

    try {
      await dispatch(createFeedback({ club, description })).unwrap();

      setShowCoinAnimation(true);

      await dispatch(creditCoins({ coins: winAmount })).unwrap();

      toast.success("Feedback submitted! 🎉 +10 coins");

      setTimeout(() => setShowCoinAnimation(false), 1500);

      navigate("/feedbacks");
      setClub("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow space-y-4"
    >
      <h1 className="text-xl sm:text-2xl font-bold">Create Feedback</h1>

      {/* ================= CLUB GRID ================= */}
      <div>
        <p className="font-semibold mb-3">Select Club</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {clubs.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setClub(item.name)}
              className={`
                rounded-xl overflow-hidden border transition-all
                ${club === item.name
                  ? "ring-2 ring-black border-black scale-[1.02]"
                  : "border-gray-300 hover:scale-[1.02]"}
              `}
            >
              {/* IMAGE */}
              <div className="relative w-full h-24 sm:h-28 md:h-32 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />

                {/* DARK OVERLAY */}
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* NAME */}
              <div className="p-2 text-center text-sm font-medium">
                {item.name}
              </div>
            </button>
          ))}
        </div>

        {!club && (
          <p className="text-xs text-gray-500 mt-2">
            Please select a club
          </p>
        )}
      </div>

      {/* ================= DESCRIPTION ================= */}
      <div>
        <textarea
          placeholder="Describe the issue..."
          value={description}
          onChange={(e) =>
            e.target.value.length <= maxDescriptionLength &&
            setDescription(e.target.value)
          }
          className="w-full p-3 border rounded min-h-[120px] sm:min-h-[140px]"
        />

        <p className="text-right text-xs text-gray-500 mt-1">
          {description.length}/{maxDescriptionLength}
        </p>
      </div>

      {/* ================= SUBMIT ================= */}
      <div className="relative">
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3 rounded text-white text-sm sm:text-base
            ${isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"}
          `}
        >
          {isLoading ? "Submitting..." : "Submit Feedback (+10 Coins)"}
        </button>

        {/* COIN ANIMATION */}
        {showCoinAnimation && (
          <span className="absolute -top-6 right-4 text-yellow-400 font-bold animate-bounce">
            +10💰
          </span>
        )}
      </div>
    </form>
  );
}