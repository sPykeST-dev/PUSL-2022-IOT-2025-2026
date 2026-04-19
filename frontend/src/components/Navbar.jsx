import { Link, useNavigate, useLocation } from 'react-router-dom'

const NAV_LINKS = [
    { to: '/admin',          label: 'Overview' },
    { to: '/admin/students', label: 'Students' },
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
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-white text-sm font-semibold tracking-tight">
          Smart Locker <span className="text-indigo-300">Admin</span>
        </span>
            </div>

            <div className="flex items-center gap-6">
                {NAV_LINKS.map(link => {
                    const isActive = location.pathname === link.to
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`text-sm font-medium pb-0.5 transition-colors ${
                                isActive
                                    ? 'text-white border-b-2 border-indigo-400'
                                    : 'text-indigo-300 hover:text-white'
                            }`}
                        >
                            {link.label}
                        </Link>
                    )
                })}
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                    Logout
                </button>
            </div>
        </nav>
    )
}

export default Navbar