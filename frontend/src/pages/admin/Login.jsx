import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
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
      {/* Left panel */}
      <div
        className="hidden md:flex flex-col justify-between w-1/2 p-12"
        style={{ background: '#1e1b4b' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-white text-sm font-semibold">Smart Locker Admin</span>
        </div>

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

        {/* Status pills decoration */}
        <div className="flex flex-col gap-3">
          {[
            { label: 'LOCKER-01', status: 'Available',   dot: 'bg-green-400' },
            { label: 'LOCKER-02', status: 'Occupied',    dot: 'bg-red-400'   },
            { label: 'LOCKER-03', status: 'Maintenance', dot: 'bg-amber-400' },
          ].map(l => (
            <div
              key={l.label}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-indigo-200 text-sm font-medium">{l.label}</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />
                {l.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
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
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ background: loading ? '#a5b4fc' : '#1e1b4b' }}
            className="mt-6 w-full text-white text-sm font-semibold rounded-xl py-3 transition-all hover:opacity-90 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login