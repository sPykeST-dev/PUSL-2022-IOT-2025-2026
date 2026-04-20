import { Link, useNavigate, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/admin',            label: 'Overview'  },
  { to: '/admin/students',   label: 'Students'  },
  { to: '/admin/analytics',  label: 'Analytics' },
]

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  return (
    <nav style={{ background: '#1e1b4b' }} className="px-6 h-14 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-white text-sm font-semibold tracking-tight">Smart Locker</span>
      </div>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(link => {
          const isActive = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          )
        })}

        <span className="w-px h-4 bg-white/10 mx-2" />

        <Link
          to="/"
          title="Public dashboard"
          className="p-2 rounded-lg text-indigo-300 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>

        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 rounded-lg text-indigo-300 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default Navbar