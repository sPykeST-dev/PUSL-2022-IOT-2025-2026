import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/api'

const LOCKER_PILLS = [
  { label: 'LOCKER-01', status: 'Available', dot: '#4ade80' },
  { label: 'LOCKER-02', status: 'Occupied', dot: '#f87171' },
  { label: 'LOCKER-03', status: 'Maintenance', dot: '#fbbf24' },
]

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username || !password) { setError('Please enter both fields.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/auth/login', { username, password })
      localStorage.setItem('adminToken', res.data.token)
      navigate('/admin')
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>

      {/* ── Left panel ── */}
      <div
        className="hidden md:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: '#1e1b4b' }}
      >
        {/* corner accents */}
        <span style={{
          position: 'absolute', top: 16, left: 16, width: 20, height: 20,
          borderTop: '2.5px solid rgba(99,102,241,0.5)', borderLeft: '2.5px solid rgba(99,102,241,0.5)',
          borderRadius: '4px 0 0 0'
        }} />
        <span style={{
          position: 'absolute', bottom: 16, right: 16, width: 20, height: 20,
          borderBottom: '2.5px solid rgba(99,102,241,0.5)', borderRight: '2.5px solid rgba(99,102,241,0.5)',
          borderRadius: '0 0 4px 0'
        }} />

        {/* Branding */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-white text-sm font-semibold tracking-tight">Smart Locker</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-4xl font-bold text-white leading-snug mb-4">
            Manage your lockers<br />
            <span className="text-indigo-300">from one place.</span>
          </h1>
          <p className="text-indigo-400 text-sm leading-relaxed">
            Monitor live status, control access, register students,<br />
            and view usage history — all in real time.
          </p>
        </div>

        {/* Locker shapes */}
        <div className="flex gap-3">
          {LOCKER_PILLS.map(l => (
            <div
              key={l.label}
              className="flex-1 flex flex-col rounded-xl p-3 relative"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 130 }}
            >
              {/* Vent slots */}
              <div className="flex flex-col gap-0.5 mb-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-full rounded-full" style={{ height: 2, background: 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>

              {/* Handle */}
              <div className="flex-1 flex items-center justify-end pr-1">
                <div className="flex flex-col items-center gap-0.5">
                  <div style={{ width: 7, height: 22, background: 'rgba(255,255,255,0.18)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.12)' }} />
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              {/* Label + status */}
              <div className="mt-2 border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-indigo-200 text-xs font-bold mb-1">{l.label}</p>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: l.dot }} />
                  <span className="text-xs font-semibold text-indigo-300">{l.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-3 rounded-tl-lg" style={{ background: '#1e1b4b' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-white text-sm font-semibold tracking-tight">Smart Locker</span>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 relative">
            {/* corner accents */}
            <span style={{
              position: 'absolute', top: 10, left: 10, width: 18, height: 18,
              borderTop: '2.5px solid #6366f1', borderLeft: '2.5px solid #6366f1',
              borderRadius: '4px 0 0 0'
            }} />
            <span style={{
              position: 'absolute', bottom: 10, right: 10, width: 18, height: 18,
              borderBottom: '2.5px solid #6366f1', borderRight: '2.5px solid #6366f1',
              borderRadius: '0 0 4px 0'
            }} />

            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-400 mb-8">Sign in to your admin account</p>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Password</label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ background: loading ? '#a5b4fc' : '#1e1b4b' }}
              className="mt-6 w-full text-white text-sm font-semibold rounded-xl py-3 transition-all hover:opacity-90 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </div>
          <Link
            to="/"
            className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
