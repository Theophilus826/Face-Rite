import Adsense from "../component/Adsense";



export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        {/* TEXT */}
        <div>
          <span className="inline-block px-4 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30 mb-6">
            Welcome to TinkTom 
          </span>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            About Our <span className="text-blue-500">Gaming World</span>
          </h1>

          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            TinkTom is a modern multiplayer gaming platform designed for players
            who love strategy, competition, and real-time experiences. Our mission
            is to create immersive adventures where players can connect, battle,
            trade, and build communities together.
          </p>

          <p className="text-gray-400 leading-relaxed mb-8">
            From exciting PvP battles to powerful guild systems and live chat,
            SwordGame combines technology and creativity to deliver an unforgettable
            online gaming experience.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition shadow-lg">
              Explore Game
            </button>

            <button className="px-6 py-3 rounded-2xl border border-white/20 hover:bg-white/10 transition">
              Learn More
            </button>
            <Adsense slot="4834199906" />
          </div>
        </div>

        {/* IMAGE */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>

          <img
            src="/multA.jpg"
            alt="Gaming setup"
            className="relative rounded-3xl shadow-2xl border border-white/10 object-cover w-full h-[500px]"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-2xl font-semibold mb-3 text-blue-400">
              Real-Time Battles
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Experience fast-paced multiplayer combat with smooth live updates
              and interactive gameplay.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-2xl font-semibold mb-3 text-purple-400">
              Guild & Team System
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Create guilds, recruit members, and dominate the leaderboard with
              your team.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-2xl font-semibold mb-3 text-pink-400">
              Live Community
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Stay connected through instant messaging, group chats, and social
              features built into the platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
