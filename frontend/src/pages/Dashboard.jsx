import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import LockerCard from '../components/LockerCard'

function Dashboard() {
  const [lockers, setLockers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLockers = () => {
    api.get('/api/lockers')
      .then(res => setLockers(res.data))
      .catch(() => setError('Failed to load locker status.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLockers()
    const interval = setInterval(fetchLockers, 5000)
    return () => clearInterval(interval)
  }, [])

  const counts = {
    UNOCCUPIED: lockers.filter(l => l.status === 'UNOCCUPIED').length,
    OCCUPIED: lockers.filter(l => l.status === 'OCCUPIED').length,
    MAINTENANCE: lockers.filter(l => l.status === 'MAINTENANCE').length,
    OFFLINE: lockers.filter(l => l.status === 'OFFLINE').length,
  }

  const PILLS = [
    { label: 'Available', count: counts.UNOCCUPIED, dot: '#10b981', color: '#d1fae5', text: '#065f46' },
    { label: 'Occupied', count: counts.OCCUPIED, dot: '#ef4444', color: '#fee2e2', text: '#991b1b' },
    { label: 'Maintenance', count: counts.MAINTENANCE, dot: '#f59e0b', color: '#fef3c7', text: '#92400e' },
    { label: 'Offline', count: counts.OFFLINE, dot: '#94a3b8', color: 'rgba(255,255,255,0.08)', text: '#a5b4fc' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ background: '#1e1b4b' }} className="px-8 py-8 relative overflow-hidden">
        {/* corner accents */}
        <span style={{
          position: 'absolute', top: 16, left: 16, width: 20, height: 20,
          borderTop: '2.5px solid rgba(99,102,241,0.4)', borderLeft: '2.5px solid rgba(99,102,241,0.4)',
          borderRadius: '4px 0 0 0', pointerEvents: 'none'
        }} />
        <span style={{
          position: 'absolute', bottom: 16, right: 16, width: 20, height: 20,
          borderBottom: '2.5px solid rgba(99,102,241,0.4)', borderRight: '2.5px solid rgba(99,102,241,0.4)',
          borderRadius: '0 0 4px 0', pointerEvents: 'none'
        }} />

        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
              </span>
              <span className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Live Status</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Smart Locker System</h1>
            {!loading && (
              <div className="flex items-center gap-2 flex-wrap">
                {PILLS.map(p => (
                  <span
                    key={p.label}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: p.color, color: p.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.dot }} />
                    {p.count} {p.label}
                  </span>
                ))}
              </div>
            )}
            {loading && <p className="text-indigo-400 text-sm">Loading…</p>}
          </div>

          {/* Improved Admin Login Button */}
          {/* Improved Admin Login Button */}
          <Link
            to="/admin/login"
            className="mt-1 relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
             text-white bg-indigo-600 hover:bg-indigo-700
             shadow-lg shadow-indigo-900/40
             transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03]
             active:scale-[0.97] overflow-hidden
             focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onClick={e => {
              const btn = e.currentTarget;
              const rect = btn.getBoundingClientRect();
              const ripple = document.createElement('span');
              const size = Math.max(rect.width, rect.height);
              ripple.style.cssText = `
      position:absolute;border-radius:50%;
      background:rgba(255,255,255,0.3);
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      transform:scale(0);pointer-events:none;
      animation:ripple-btn 0.55s linear forwards;
    `;
              btn.appendChild(ripple);
              setTimeout(() => ripple.remove(), 600);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Admin Login</span>
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center mt-20 text-slate-400 text-sm">Loading lockers…</div>
        )}
        {error && (
          <div className="text-center mt-20 text-red-400 text-sm">{error}</div>
        )}
        {!loading && !error && lockers.length === 0 && (
          <div className="text-center mt-20 text-slate-400 text-sm">No lockers found.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lockers.map(locker => (
            <LockerCard key={locker.id} locker={locker} isAdmin={false} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default Dashboard