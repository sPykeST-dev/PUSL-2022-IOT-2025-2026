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
      <div className="flex-1 flex items-center justify-center px-8" style={{ background: '#f1f5f9' }}>
        <div className="w-full max-w-sm">

          {/* Form card */}
          <div className="rounded-2xl p-8" style={{ background: '#fff', border: '1px solid #e8edf3' }}>

            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ background: '#eef2ff' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>Welcome back</h2>
            <p className="text-sm mb-7" style={{ color: '#94a3b8' }}>Sign in to your admin account</p>

            {error && (
              <div className="mb-5 text-sm rounded-xl px-4 py-3" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="inline-block w-0.5 h-3.5 rounded-sm" style={{ background: '#4f46e5' }} />
                  <label className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Username</label>
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50px',
                    color: '#0f172a',
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="inline-block w-0.5 h-3.5 rounded-sm" style={{ background: '#4f46e5' }} />
                  <label className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full px-5 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '50px',
                      color: '#0f172a',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-semibold transition-colors hover:text-slate-600"
                    style={{ color: '#94a3b8' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full text-white text-sm font-semibold py-3 transition-all hover:opacity-90 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#a5b4fc' : '#1e1b4b',
                borderRadius: '50px',
                letterSpacing: '0.02em',
                border: 'none',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </div>

          <Link
            to="/"
            className="mt-5 flex items-center justify-center gap-2 text-sm font:medium transition-colors hover:text-slate-600"
            style={{ color: '#94a3b8' }}
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
