import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { ApplicationList } from '@/pages/applications/ApplicationList'
import { ApplicationForm } from '@/pages/applications/ApplicationForm'
import { ApplicationDetail } from '@/pages/applications/ApplicationDetail'
import { RecruiterList } from '@/pages/recruiters/RecruiterList'
import { RecruiterDetail } from '@/pages/recruiters/RecruiterDetail'
import { ClientList } from '@/pages/clients/ClientList'
import { ClientDetail } from '@/pages/clients/ClientDetail'
import { CVLibrary } from '@/pages/cv-library/CVLibrary'
import { PrepNotesLibrary } from '@/pages/prep-notes-library/PrepNotesLibrary'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/applications" element={<ApplicationList />} />
        <Route path="/applications/new" element={<ApplicationForm />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/applications/:id/edit" element={<ApplicationForm />} />

        <Route path="/recruiters" element={<RecruiterList />} />
        <Route path="/recruiters/:id" element={<RecruiterDetail />} />

        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/:id" element={<ClientDetail />} />

        <Route path="/cv-library" element={<CVLibrary />} />
        <Route path="/prep-notes" element={<PrepNotesLibrary />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
