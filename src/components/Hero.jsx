import Spline from '@splinetool/react-spline'

export default function Hero({ onPlayClick }) {
  return (
    <section className="relative w-full h-[80vh] overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/OIGfFUmCnZ3VD8gH/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white pointer-events-none" />

      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
            Mario-style Kart Racing
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-700">
            Drift, grab power-ups, and blast your friends with fun effects in a fast, arcade multiplayer race.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={onPlayClick} className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md transition">
              Play Now
            </button>
            <a href="/test" className="px-6 py-3 rounded-lg bg-gray-900/80 hover:bg-gray-900 text-white font-semibold shadow-md transition">
              Check Backend
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
