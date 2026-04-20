import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/api'
import Navbar from '../../components/Navbar'

const STATUS_BADGE = {
    UNOCCUPIED:  'bg-green-100 text-green-800',
    OCCUPIED:    'bg-red-100 text-red-800',
    MAINTENANCE: 'bg-amber-100 text-amber-800',
    OFFLINE:     'bg-slate-100 text-slate-500',
}

const EVENT_BADGE = {
    LOCKED:          'bg-indigo-100 text-indigo-700',
    UNLOCKED:        'bg-green-100 text-green-700',
    MAINTENANCE_ON:  'bg-amber-100 text-amber-700',
    MAINTENANCE_OFF: 'bg-slate-100 text-slate-500',
    REMOTE_UNLOCK:   'bg-purple-100 text-purple-700',
}

function LockerDetail() {
    const { id } = useParams()
    const [locker,    setLocker]    = useState(null)
    const [logs,      setLogs]      = useState([])
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState(null)
    const [actionMsg, setActionMsg] = useState({ text: '', type: '' })

    const fetchData = () => {
        Promise.all([
            api.get(`/api/locker/${id}`),
            api.get(`/api/admin/locker/${id}/logs`),
        ])
            .then(([l, lg]) => { setLocker(l.data); setLogs(lg.data) })
            .catch(() => setError('Failed to load locker details.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [id])

    const handleAction = async (endpoint, msg) => {
        setActionMsg({ text: '', type: '' })
        try {
            await api.post(endpoint)
            setActionMsg({ text: msg, type: 'success' })
            fetchData()
        } catch {
            setActionMsg({ text: 'Action failed. Please try again.', type: 'error' })
        }
    }

    return (
        <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
            <Navbar />

            <div className="bg-white border-b border-slate-100 px-8 py-5">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <Link to="/admin" className="text-indigo-500 hover:text-indigo-700 text-sm font-medium">← Overview</Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-500 text-sm">{id}</span>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {loading && <p className="text-slate-400 text-sm text-center mt-16">Loading...</p>}
                {error   && <p className="text-red-400 text-sm text-center mt-16">{error}</p>}

                {locker && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{locker.id}</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">{locker.location || 'No location set'}</p>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_BADGE[locker.status] ?? STATUS_BADGE.OFFLINE}`}>
                  {locker.status}
                </span>
                            </div>

                            {locker.currentCardUid && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-slate-400">Current card:</span>
                                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">{locker.currentCardUid}</span>
                                </div>
                            )}
                            {locker.lastUpdated && (
                                <p className="text-xs text-slate-300 mb-5">Last updated: {new Date(locker.lastUpdated).toLocaleString()}</p>
                            )}

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleAction(`/api/admin/locker/${id}/maintenance`, 'Maintenance mode toggled.')}
                                    className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl px-6 py-2.5 transition-colors"
                                >
                                    Toggle maintenance
                                </button>
                                <button
                                    onClick={() => handleAction(`/api/admin/locker/${id}/unlock`, 'Emergency unlock sent.')}
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl px-6 py-2.5 transition-colors"
                                >
                                    Emergency unlock
                                </button>
                            </div>

                            {actionMsg.text && (
                                <p className={`mt-4 text-sm font-medium ${actionMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                    {actionMsg.text}
                                </p>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-800">Usage log</h3>
                                <span className="text-xs text-slate-400">{logs.length} events</span>
                            </div>

                            {logs.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-12">No events recorded yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide">
                                            <th className="px-6 py-3 text-left">Event</th>
                                            <th className="px-6 py-3 text-left">Card UID</th>
                                            <th className="px-6 py-3 text-left">Student</th>
                                            <th className="px-6 py-3 text-left">Time</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3.5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${EVENT_BADGE[log.event] ?? 'bg-slate-100 text-slate-500'}`}>
                              {log.event}
                            </span>
                                                </td>
                                                <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{log.cardUid || '—'}</td>
                                                <td className="px-6 py-3.5 text-slate-600 text-xs">{log.studentName || '—'}</td>
                                                <td className="px-6 py-3.5 text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default LockerDetail
