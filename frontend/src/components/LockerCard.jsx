import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  UNOCCUPIED: {
    label: 'Available',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-800',
    border: 'border-green-200',
    btn: 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100',
  },
  OCCUPIED: {
    label: 'Occupied',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800',
    border: 'border-red-200',
    btn: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200',
    btn: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  OFFLINE: {
    label: 'Offline',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600',
    border: 'border-slate-200',
    btn: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
  },
}

function LockerCard({ locker, isAdmin = false }) {
  const config = STATUS_CONFIG[locker.status] ?? STATUS_CONFIG.OFFLINE

  return (
    <div className={`bg-white rounded-2xl border-2 ${config.border} p-5 flex flex-col gap-3 transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-slate-800">{locker.id}</p>
          <p className="text-xs text-slate-400 mt-0.5">{locker.location || 'No location set'}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      {locker.lastUpdated && (
        <p className="text-xs text-slate-300">
          Updated {new Date(locker.lastUpdated).toLocaleString()}
        </p>
      )}

      {isAdmin && (
        <Link
          to={`/admin/locker/${locker.id}`}
          className={`mt-1 text-center text-xs font-semibold border rounded-xl py-2 transition-colors ${config.btn}`}
        >
          Manage →
        </Link>
      )}
    </div>
  )
}

export default LockerCard