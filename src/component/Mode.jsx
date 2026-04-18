import React, { useState } from "react";

const moods = [
  { emoji: "😡", label: "Angry" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😴", label: "Calm" },
  { emoji: "😁", label: "Happy" },
  { emoji: "🥰", label: "Blessed" },
  { emoji: "😜", label: "Fun" },
];

const Mode = ({ onSelectMood, onSkip }) => {
  const [selectedMood, setSelectedMood] = useState(null);

  const handleMoodClick = (mood) => {
    setSelectedMood(mood.label); // highlight
    setTimeout(() => {
      onSelectMood(mood.label); // send mood after brief animation
    }, 300); // 0.3s for animation
  };

  return (
    <div className="relative w-full h-full bg-black/70 flex items-center justify-center">
      {/* Background Image */}
      <img
        src="/mode.jpg"
        alt="bg"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />

      {/* Skip Button (conditionally disabled) */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={onSkip}
          className={`text-white text-lg opacity-80 hover:opacity-100 ${
            !onSkip ? "cursor-not-allowed opacity-40" : ""
          }`}
          disabled={!onSkip}
        >
          Skip
        </button>
      </div>

      {/* Overlay Content */}
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 w-full max-w-sm shadow-xl">
          {/* Title */}
          <h2 className="text-center text-lg font-semibold mb-4">
            How are you feeling today?
          </h2>

          {/* Emoji Grid */}
          <div className="grid grid-cols-3 gap-4">
            {moods.map((mood, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-gray-100 transition cursor-pointer ${
                  selectedMood === mood.label
                    ? "scale-110 bg-blue-200 animate-pulse"
                    : ""
                }`}
                onClick={() => handleMoodClick(mood)}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs mt-1">{mood.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Mood Bar */}
      <div className="absolute bottom-6 w-full flex justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-full px-6 py-3 flex gap-6 shadow-lg">
          <div className="flex flex-col items-center">
            <span className="text-xl">😌</span>
            <span className="text-xs">Calm</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl">😁</span>
            <span className="text-xs">Happy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl">🥰</span>
            <span className="text-xs">Blessed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mode;