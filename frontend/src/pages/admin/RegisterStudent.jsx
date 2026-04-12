import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/api'
import Navbar from '../../components/Navbar'

const FIELDS = [
  { name: 'studentNumber', label: 'Student number',  placeholder: 'e.g. 31600',              type: 'text',  mono: false },
  { name: 'name',          label: 'Full name',        placeholder: 'e.g. John Silva',          type: 'text',  mono: false },
  { name: 'email',         label: 'Email address',    placeholder: 'e.g. john@university.lk',  type: 'email', mono: false },
  { name: 'rfidCardUid',   label: 'RFID card UID',    placeholder: 'e.g. A1:B2:C3:D4',         type: 'text',  mono: true  },
]

function RegisterStudent() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ studentNumber: '', name: '', email: '', rfidCardUid: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

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
            {FIELDS.map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  name={f.name}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={handleChange}
                  className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition ${f.mono ? 'font-mono' : ''}`}
                />
              </div>
            ))}
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