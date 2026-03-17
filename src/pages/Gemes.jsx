import React from 'react';
import { Link } from 'react-router-dom';

// Your image list
const imageList = [
  { src: '/multA.jpg' },
  { src: '/multCA.jpg' },
  { src: '/multCall.jpg' },
  { src: '/multGra.jpg' },
  { src: '/multpunch.jpg' },
  { src: '/multRball.jpg' },
];

// Map images into games
const games = imageList.map((img, index) => ({
  id: `game-${index}`,
  title:
    index === 0
      ? 'Spirit Sword'
      : index === 1
      ? 'Maltar Combat'
      : index === 2
      ? 'Call of Gaiden'
      : index === 3
      ? 'Grand Arena'
      : index === 4
      ? 'Punch Legends'
      : index === 5
      ? 'Royal Ball'
      : `Game ${index + 1}`,
  provider: 'PG',
  tag: index === 0 ? 'NEW' : index === 1 ? 'HOT' : '',
  img: img.src,
}));

export default function Gemes() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-3 sm:px-4 md:px-6 py-4">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">🔥 Hot</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {games.map((game) => (
          <Link
            to="/not-available"
            key={game.id}
            className="relative bg-[#1e293b] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition block"
          >
            <img
              src={game.img}
              alt={game.title}
              className="w-full h-24 sm:h-28 md:h-32 lg:h-36 object-cover"
            />

            {game.tag && (
              <span className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-red-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {game.tag}
              </span>
            )}

            <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-black/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {game.provider}
            </span>

            <div className="p-1.5 sm:p-2 text-[11px] sm:text-sm font-semibold text-center truncate">
              {game.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ROUTE for Not Available Page
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Gemes from './Gemes';

// function NotAvailable() {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
//       <h1 className="text-xl sm:text-2xl font-bold">🚧 Game Not Available Yet</h1>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Gemes />} />
//         <Route path="/not-available" element={<NotAvailable />} />
//       </Routes>
//     </Router>
//   );
// }
