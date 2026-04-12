import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import Dashboard from './pages/Dashboard'
import Login from './pages/admin/Login'
import AdminOverview from './pages/admin/AdminOverview'
import LockerDetail from './pages/admin/LockerDetail'
import StudentList from './pages/admin/StudentList'
import RegisterStudent from './pages/admin/RegisterStudent'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Dashboard />} />

        {/* Admin login — public */}
        <Route path="/admin/login" element={<Login />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locker/:id"
          element={
            <ProtectedRoute>
              <LockerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute>
              <StudentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/new"
          element={
            <ProtectedRoute>
              <RegisterStudent />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App