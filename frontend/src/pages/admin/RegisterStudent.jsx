import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/api'
import Navbar from '../../components/Navbar'

function RegisterStudent() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ studentNumber: '', name: '', email: '', rfidCardUid: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Locker scan
  const [lockers,      setLockers]      = useState([])
  const [scanLockerId, setScanLockerId] = useState('')
  const [scanStatus,   setScanStatus]   = useState('idle') // idle | scanning | done | timeout
  const pollRef    = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    api.get('/api/lockers')
      .then(res => {
        const free = res.data.filter(l => l.status === 'UNOCCUPIED')
        setLockers(free)
        if (free.length > 0) setScanLockerId(free[0].id)
      })
      .catch(() => {})
    return () => { clearInterval(pollRef.current); clearTimeout(timeoutRef.current) }
  }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const startScan = async () => {
    if (!scanLockerId) return
    setScanStatus('scanning')
    setForm(prev => ({ ...prev, rfidCardUid: '' }))
    try {
      await api.post(`/api/admin/locker/${scanLockerId}/scan`)
    } catch {
      setScanStatus('idle')
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/admin/locker/${scanLockerId}/scan-result`)
        if (res.status === 200 && res.data?.cardUid) {
          setForm(prev => ({ ...prev, rfidCardUid: res.data.cardUid }))
          setScanStatus('done')
          clearInterval(pollRef.current)
          clearTimeout(timeoutRef.current)
        }
      } catch { /* 204 = still waiting */ }
    }, 2000)
    timeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current)
      setScanStatus('timeout')
    }, 62000)
  }

  const cancelScan = () => {
    clearInterval(pollRef.current)
    clearTimeout(timeoutRef.current)
    setScanStatus('idle')
  }

  const handleSubmit = async () => {
    setError('')
    if (Object.values(form).some(v => !v.trim())) { setError('All fields are required.'); return }
    setLoading(true)
    try {
      await api.post('/api/admin/students', form)
      navigate('/admin/students')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Navbar />

      <div className="bg-white border-b border-slate-100 px-8 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/admin/students" className="text-indigo-500 hover:text-indigo-700 text-sm font-medium">← Students</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 text-sm">Register student</span>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Register student</h2>
            <p className="text-sm text-slate-400 mt-0.5">Link an RFID card to a student record.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            {[
              { name: 'studentNumber', label: 'Student number', placeholder: 'e.g. 31600',             type: 'text'  },
              { name: 'name',          label: 'Full name',       placeholder: 'e.g. John Silva',         type: 'text'  },
              { name: 'email',         label: 'Email address',   placeholder: 'e.g. john@university.lk', type: 'email' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>
            ))}

            {/* RFID section */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">RFID card UID</label>

              {/* Scan row */}
              <div className="flex gap-2 mb-2">
                <select
                  value={scanLockerId}
                  onChange={e => setScanLockerId(e.target.value)}
                  disabled={scanStatus === 'scanning' || lockers.length === 0}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                >
                  {lockers.length === 0
                    ? <option value="">No free lockers</option>
                    : lockers.map(l => <option key={l.id} value={l.id}>{l.id} — {l.location}</option>)
                  }
                </select>

                {scanStatus === 'scanning' ? (
                  <button
                    type="button"
                    onClick={cancelScan}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startScan}
                    disabled={lockers.length === 0}
                    style={{ background: '#1e1b4b' }}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    Scan card
                  </button>
                )}
              </div>

              {/* Status message */}
              {scanStatus === 'scanning' && (
                <div className="mb-2 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                  <span className="animate-pulse">●</span>
                  Tap the student's card on <span className="font-semibold">{scanLockerId}</span> now…
                </div>
              )}
              {scanStatus === 'done' && (
                <div className="mb-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  ✓ Card scanned successfully
                </div>
              )}
              {scanStatus === 'timeout' && (
                <div className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Scan timed out — enter the UID manually or try again.
                </div>
              )}

              {/* Manual input */}
              <input
                type="text"
                name="rfidCardUid"
                placeholder="e.g. A1:B2:C3:D4"
                value={form.rfidCardUid}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ background: loading ? '#a5b4fc' : '#1e1b4b' }}
              className="flex-1 text-white text-sm font-semibold rounded-xl py-3 transition-all hover:opacity-90 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register student →'}
            </button>
            <Link
              to="/admin/students"
              className="flex-1 text-center text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl py-3 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RegisterStudent
