import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetails from './pages/CandidateDetails';
import CandidateFormPage from './pages/CandidateFormPage';
import Pipeline from './pages/Pipeline';
import Jobs from './pages/Jobs';
import CalendarPage from './pages/CalendarPage';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="main-content flex-1">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Admin Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates"
            element={
              <ProtectedRoute>
                <Layout><Candidates /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/new"
            element={
              <ProtectedRoute>
                <Layout><CandidateFormPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/:id"
            element={
              <ProtectedRoute>
                <Layout><CandidateDetails /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/:id/edit"
            element={
              <ProtectedRoute>
                <Layout><CandidateFormPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute>
                <Layout><Pipeline /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout><CalendarPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Layout><Jobs /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
