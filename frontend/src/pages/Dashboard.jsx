import { useEffect, useState } from 'react'
import api from '../api/api'
import LockerCard from '../components/LockerCard'

function Dashboard() {
  const [lockers, setLockers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

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

  const available = lockers.filter(l => l.status === 'UNOCCUPIED').length

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ background: '#1e1b4b' }} className="px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Live Status</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Smart Locker System</h1>
          <p className="text-indigo-400 text-sm">
            {loading ? 'Loading...' : `${available} of ${lockers.length} lockers available`} · updates every 5s
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center mt-20 text-slate-400 text-sm">Loading lockers...</div>
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