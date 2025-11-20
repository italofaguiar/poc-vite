import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

// OAuth redirect component (temporary until GoogleSignInButton is implemented)
function OAuthRedirect({ path }: { path: string }) {
  useEffect(() => {
    // Redirect to backend API endpoint
    window.location.href = `/api${path}`
  }, [path])

  return <div>Redirecting to Google...</div>
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* OAuth routes - redirect to backend */}
          <Route path="/api/auth/google/login" element={<OAuthRedirect path="/auth/google/login" />} />
          <Route path="/api/auth/google/callback" element={<OAuthRedirect path="/auth/google/callback" />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
