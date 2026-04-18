import React from "react";
import { Link } from "react-router-dom";

// Your image list
const imageList = [
  { src: "/multA.jpg" },
  { src: "/multCA.jpg" },
  { src: "/multCall.jpg" },
  { src: "/multGra.jpg" },
  { src: "/multpunch.jpg" },
  { src: "/multRball.jpg" },
];

// Map images into games
const games = imageList.map((img, index) => ({
  id: `game-${index}`,
  title:
    index === 0
      ? "Spirit Sword"
      : index === 1
        ? "Maltar Combat"
        : index === 2
          ? "Call of Gaiden"
          : index === 3
            ? "Grand Arena"
            : index === 4
              ? "Punch Legends"
              : index === 5
                ? "Royal Ball"
                : `Game ${index + 1}`,
  provider: "PG",
  tag: index === 0 ? "NEW" : index === 1 ? "HOT" : "",
  img: img.src,
  route: "/host-game",
}));

export default function Gemes() {
  return (
    <div className="min-h-screen bg-transparent text-white px-4 py-6 backdrop-blur-sm">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        🔥 Hot Games
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {games.map((game) => (
          <Link
            to={game.route}
            key={game.id}
            className="relative group rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
          >
            {/* Image with subtle AI neon glow */}
            <div className="relative">
              <img
                src={game.img}
                alt={game.title}
                className="w-full h-28 sm:h-32 md:h-36 lg:h-40 object-cover rounded-2xl border border-white/10 shadow-inner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            </div>

            {/* Tag and provider badges */}
            {game.tag && (
              <span className="absolute top-2 left-2 bg-red-500 text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                {game.tag}
              </span>
            )}
            <span className="absolute top-2 right-2 bg-black/50 text-xs px-2 py-1 rounded-full font-medium">
              {game.provider}
            </span>

            {/* Game title overlay */}
            <div className="absolute bottom-0 w-full bg-black/50 backdrop-blur-sm text-center py-1.5 rounded-b-2xl font-semibold text-sm truncate">
              {game.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
