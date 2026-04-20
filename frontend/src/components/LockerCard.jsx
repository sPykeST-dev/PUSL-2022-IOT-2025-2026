import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  UNOCCUPIED: {
    label: 'Available',
    dot: '#10b981',
    labelColor: '#059669',
    accent: '#10b981',
    slotBg: 'rgba(16,185,129,0.12)',
    handleBg: 'rgba(16,185,129,0.22)',
    handleBorder: 'rgba(16,185,129,0.15)',
  },
  OCCUPIED: {
    label: 'Occupied',
    dot: '#ef4444',
    labelColor: '#dc2626',
    accent: '#ef4444',
    slotBg: 'rgba(239,68,68,0.12)',
    handleBg: 'rgba(239,68,68,0.2)',
    handleBorder: 'rgba(239,68,68,0.14)',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    dot: '#f59e0b',
    labelColor: '#d97706',
    accent: '#f59e0b',
    slotBg: 'rgba(245,158,11,0.12)',
    handleBg: 'rgba(245,158,11,0.22)',
    handleBorder: 'rgba(245,158,11,0.14)',
  },
  OFFLINE: {
    label: 'Offline',
    dot: '#94a3b8',
    labelColor: '#64748b',
    accent: '#cbd5e1',
    slotBg: 'rgba(148,163,184,0.18)',
    handleBg: 'rgba(148,163,184,0.28)',
    handleBorder: 'rgba(148,163,184,0.18)',
  },
}

function LockerCard({ locker, isAdmin = false }) {
  const cfg = STATUS_CONFIG[locker.status] ?? STATUS_CONFIG.OFFLINE

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm relative flex flex-col transition-shadow hover:shadow-md"
      style={{ minHeight: 210 }}
    >
      {/* Vent slots */}
      <div className="flex flex-col gap-1 px-5 pt-6 mb-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-full rounded-full" style={{ height: 2.5, background: cfg.slotBg }} />
        ))}
      </div>

      {/* Handle — centered in remaining space */}
      <div className="flex-1 flex items-center justify-end pr-5">
        <div className="flex flex-col items-center gap-1">
          <div style={{
            width: 8, height: 26,
            background: cfg.handleBg,
            borderRadius: 4,
            border: `1px solid ${cfg.handleBorder}`,
          }} />
          <div style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: cfg.slotBg,
            border: `1px solid ${cfg.handleBorder}`,
          }} />
        </div>
      </div>

      {/* Info — bottom strip */}
      <div className="px-5 pb-5 mt-1 border-t border-slate-100 pt-3">
        <p className="text-sm font-bold text-slate-800 tracking-tight">{locker.id}</p>
        <p className="text-xs text-slate-400 mb-2">{locker.location || 'No location set'}</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
            <span className="text-xs font-semibold" style={{ color: cfg.labelColor }}>{cfg.label}</span>
          </span>
          {isAdmin && (
            <Link
              to={`/admin/locker/${locker.id}`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              Manage →
            </Link>
          )}
        </div>
        {locker.lastUpdated && (
          <p className="text-xs text-slate-300 mt-1.5">
            {new Date(locker.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

export default LockerCard
