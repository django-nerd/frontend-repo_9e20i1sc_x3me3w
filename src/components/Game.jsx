import { useEffect, useMemo, useRef, useState } from 'react'

// Simple 2D canvas racer with power-ups and multiplayer sync over WebSocket
export default function Game() {
  const canvasRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [players, setPlayers] = useState({}) // name -> state
  const [me, setMe] = useState({ name: '', color: '', x: 120, y: 120, angle: 0, vx: 0, vy: 0, speed: 0 })
  const [messages, setMessages] = useState([])
  const [room, setRoom] = useState('lobby')
  const wsRef = useRef(null)

  // Choose a friendly player name & color
  useEffect(() => {
    const rnd = Math.floor(Math.random() * 999)
    const name = `Racer${rnd}`
    const colors = ['#ff4757', '#3742fa', '#2ed573', '#ffa502', '#a55eea', '#1e90ff']
    setMe((m) => ({ ...m, name, color: colors[rnd % colors.length] }))
  }, [])

  const backendBase = import.meta.env.VITE_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:8000'
  const wsUrl = useMemo(() => `${backendBase.replace(/\/$/, '')}/ws/${room}`, [backendBase, room])

  // Controls
  const keys = useRef({})
  useEffect(() => {
    const down = (e) => { keys.current[e.key.toLowerCase()] = true }
    const up = (e) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Connect WS
  const connect = () => {
    if (wsRef.current) wsRef.current.close()
    const sock = new WebSocket(wsUrl)
    wsRef.current = sock

    sock.onopen = () => {
      setConnected(true)
      // First message must be join
      sock.send(JSON.stringify({ type: 'join', player: me.name }))
    }
    sock.onclose = () => setConnected(false)
    sock.onerror = () => setConnected(false)
    sock.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'joined') {
        pushMsg(`Joined ${msg.room} as ${msg.player}`)
      } else if (msg.type === 'system') {
        pushMsg(`${msg.player} ${msg.event === 'join' ? 'joined' : 'left'} the room`)
      } else if (msg.type === 'update') {
        setPlayers((p) => ({ ...p, [msg.player]: { ...msg } }))
      } else if (msg.type === 'chat') {
        pushMsg(`${msg.player}: ${msg.text}`)
      } else if (msg.type === 'powerup') {
        pushMsg(`${msg.player} used ${msg.kind}!`)
      }
    }
  }

  const pushMsg = (t) => setMessages((m) => [...m.slice(-6), t])

  // Physics + render
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    let raf

    const state = { x: 160, y: 200, angle: 0, vx: 0, vy: 0, speed: 0 }

    const loop = () => {
      // Update my car based on keys
      const acc = 0.25
      const turn = 0.05
      const maxSpeed = 4

      if (keys.current['w'] || keys.current['arrowup']) state.speed = Math.min(maxSpeed, state.speed + acc)
      if (keys.current['s'] || keys.current['arrowdown']) state.speed = Math.max(-maxSpeed/2, state.speed - acc)
      if (keys.current['a'] || keys.current['arrowleft']) state.angle -= turn * (state.speed/ maxSpeed + 0.5)
      if (keys.current['d'] || keys.current['arrowright']) state.angle += turn * (state.speed/ maxSpeed + 0.5)

      // friction
      state.speed *= 0.98

      state.vx = Math.cos(state.angle) * state.speed
      state.vy = Math.sin(state.angle) * state.speed
      state.x += state.vx
      state.y += state.vy

      // bounds
      const w = canvas.width, h = canvas.height
      state.x = Math.max(20, Math.min(w-20, state.x))
      state.y = Math.max(20, Math.min(h-20, state.y))

      // Broadcast my position occasionally
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({
          type: 'update',
          player: me.name,
          x: state.x, y: state.y, angle: state.angle, vx: state.vx, vy: state.vy
        }))
      }

      // Render
      ctx.clearRect(0, 0, w, h)

      // Track
      drawTrack(ctx, w, h)

      // Other players
      Object.values(players).forEach((pl) => {
        if (pl.player !== me.name) drawCar(ctx, pl.x, pl.y, pl.angle, '#333', '#999')
      })

      // Me
      drawCar(ctx, state.x, state.y, state.angle, me.color || '#e74c3c', '#ffffff')

      raf = requestAnimationFrame(loop)
    }

    if (canvas && ctx) {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      raf = requestAnimationFrame(loop)
    }

    return () => cancelAnimationFrame(raf)
  }, [players, me.name, me.color])

  // simple track
  const drawTrack = (ctx, w, h) => {
    ctx.fillStyle = '#6ab04c'
    ctx.fillRect(0,0,w,h)
    ctx.fillStyle = '#2d3436'
    ctx.beginPath()
    ctx.roundRect(40, 40, w-80, h-80, 80)
    ctx.fill()

    // dashed inside lane
    ctx.setLineDash([12, 10])
    ctx.strokeStyle = '#f1c40f'
    ctx.lineWidth = 3
    ctx.strokeRect(80, 80, w-160, h-160)
    ctx.setLineDash([])
  }

  const drawCar = (ctx, x, y, angle, body, stripe) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    // body
    ctx.fillStyle = body
    ctx.fillRect(-14, -8, 28, 16)
    // stripe
    ctx.fillStyle = stripe
    ctx.fillRect(-3, -8, 6, 16)
    // wheels
    ctx.fillStyle = '#111'
    ctx.fillRect(-16, -10, 6, 20)
    ctx.fillRect(10, -10, 6, 20)
    ctx.restore()
  }

  // UI interactions
  const usePowerup = (kind) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'powerup', player: me.name, kind }))
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <input value={room} onChange={(e)=>setRoom(e.target.value)} className="px-3 py-2 rounded border" placeholder="room" />
          <button onClick={connect} className={`px-3 py-2 rounded text-white ${connected ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{connected ? 'Connected' : 'Connect'}</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>usePowerup('banana')} className="px-3 py-2 rounded bg-yellow-500 text-black">Banana</button>
          <button onClick={()=>usePowerup('shell')} className="px-3 py-2 rounded bg-red-500 text-white">Shell</button>
          <button onClick={()=>usePowerup('boost')} className="px-3 py-2 rounded bg-purple-600 text-white">Boost</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3 bg-white rounded-xl shadow overflow-hidden">
          <div className="relative w-full h-[60vh]">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-3">
          <h3 className="font-semibold mb-2">Room: {room}</h3>
          <div className="text-sm text-gray-600 mb-2">You are {me.name || '...'}</div>
          <div className="h-[45vh] overflow-auto text-sm space-y-1">
            {messages.map((m,i)=> <div key={i} className="px-2 py-1 rounded bg-gray-100">{m}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
