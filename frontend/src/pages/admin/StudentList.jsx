import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/api'
import Navbar from '../../components/Navbar'

function StudentList() {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchStudents = () => {
    api.get('/api/admin/students')
      .then(res => setStudents(res.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStudents() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student? This cannot be undone.')) return
    setDeleting(id)
    try {
      await api.delete(`/api/admin/students/${id}`)
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Failed to delete student.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Navbar />

      <div className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Students</h2>
            <p className="text-sm text-slate-400 mt-0.5">{students.length} registered</p>
          </div>
          <Link
            to="/admin/students/new"
            style={{ background: '#1e1b4b' }}
            className="text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity"
          >
            + Register student
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && <p className="text-slate-400 text-sm text-center mt-16">Loading...</p>}
        {error   && <p className="text-red-400 text-sm text-center mt-16">{error}</p>}
        {!loading && !error && students.length === 0 && (
          <div className="text-center mt-20">
            <p className="text-slate-400 text-sm mb-4">No students registered yet.</p>
            <Link to="/admin/students/new" className="text-indigo-500 text-sm font-medium hover:underline">
              Register your first student →
            </Link>
          </div>
        )}

        {students.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3.5 text-left">Student no.</th>
                    <th className="px-6 py-3.5 text-left">Name</th>
                    <th className="px-6 py-3.5 text-left">Email</th>
                    <th className="px-6 py-3.5 text-left">RFID card</th>
                    <th className="px-6 py-3.5 text-left">Registered</th>
                    <th className="px-6 py-3.5 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs">
                          {student.studentNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{student.name}</td>
                      <td className="px-6 py-4 text-slate-500">{student.email}</td>
                      <td className="px-6 py-4">
                        {student.rfidCardUid
                          ? <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{student.rfidCardUid}</span>
                          : <span className="text-slate-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{new Date(student.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={deleting === student.id}
                          className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                        >
                          {deleting === student.id ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default StudentList