import { useEffect, useState } from 'react'
import api from '../../api/api'
import Navbar from '../../components/Navbar'
import LockerCard from '../../components/LockerCard'

const STATS = [
  { key: 'unoccupied',  label: 'Available',   bg: 'bg-green-100', text: 'text-green-800', num: 'text-green-700' },
  { key: 'occupied',    label: 'Occupied',    bg: 'bg-red-100',   text: 'text-red-800',   num: 'text-red-700'   },
  { key: 'maintenance', label: 'Maintenance', bg: 'bg-amber-100', text: 'text-amber-800', num: 'text-amber-700' },
  { key: 'offline',     label: 'Offline',     bg: 'bg-slate-100', text: 'text-slate-600', num: 'text-slate-500' },
]

function AdminOverview() {
  const [lockers, setLockers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchLockers = () => {
    api.get('/api/lockers')
      .then(res => setLockers(res.data))
      .catch(() => setError('Failed to load lockers.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLockers()
    const interval = setInterval(fetchLockers, 5000)
    return () => clearInterval(interval)
  }, [])

  const counts = lockers.reduce((acc, l) => {
    const key = (l.status ?? 'offline').toLowerCase()
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800">Locker overview</h2>
          <p className="text-sm text-slate-400 mt-0.5">Live status · updates every 5 seconds</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary cards */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {STATS.map(s => (
              <div key={s.key} className={`${s.bg} rounded-2xl px-5 py-4`}>
                <p className={`text-3xl font-bold ${s.num}`}>{counts[s.key] || 0}</p>
                <p className={`text-xs font-semibold mt-1 ${s.text}`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading && <p className="text-slate-400 text-sm text-center mt-16">Loading...</p>}
        {error   && <p className="text-red-400 text-sm text-center mt-16">{error}</p>}
        {!loading && !error && lockers.length === 0 && (
          <p className="text-slate-400 text-sm text-center mt-16">No lockers found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lockers.map(locker => (
            <LockerCard key={locker.id} locker={locker} isAdmin={true} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default AdminOverview