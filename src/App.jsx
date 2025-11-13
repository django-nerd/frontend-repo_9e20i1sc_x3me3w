import { useRef, useState } from 'react'
import Hero from './components/Hero'
import Game from './components/Game'

function App() {
  const gameRef = useRef(null)
  const [showGame, setShowGame] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <Hero onPlayClick={() => setShowGame(true)} />

      <main className="px-6 py-12">
        {showGame ? (
          <section>
            <div className="max-w-5xl mx-auto mb-6">
              <h2 className="text-2xl font-bold">Multiplayer Arcade Race</h2>
              <p className="text-gray-600">Use WASD or Arrow keys to drive. Join a room, then share the room name with friends to race together.</p>
            </div>
            <Game ref={gameRef} />
          </section>
        ) : (
          <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white shadow">
              <h3 className="font-semibold">Real-time Multiplayer</h3>
              <p className="text-gray-600 text-sm">Jump into a room with friends; your cars sync live using WebSockets.</p>
            </div>
            <div className="p-6 rounded-xl bg-white shadow">
              <h3 className="font-semibold">Mario-style Power-ups</h3>
              <p className="text-gray-600 text-sm">Drop bananas, fire shells, or boost ahead with simple, fun effects.</p>
            </div>
            <div className="p-6 rounded-xl bg-white shadow">
              <h3 className="font-semibold">Fast Arcade Physics</h3>
              <p className="text-gray-600 text-sm">Tight turns, light drift, and quick races on a simple track.</p>
            </div>
          </section>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-gray-500">Built with ❤️ — Have fun!</footer>
    </div>
  )
}

export default App
