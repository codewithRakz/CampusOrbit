import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard role pages
import StudentDashboard from './pages/dashboards/StudentDashboard';
import StudentProfile from './pages/dashboards/StudentProfile';
import StudentSkillsProjects from './pages/dashboards/StudentSkillsProjects';
import StudentOpportunities from './pages/dashboards/StudentOpportunities';
import StudentApplications from './pages/dashboards/StudentApplications';
import FacultyDashboard from './pages/dashboards/FacultyDashboard';
import FacultyCohorts from './pages/dashboards/FacultyCohorts';
import FacultyOpportunities from './pages/dashboards/FacultyOpportunities';
import PlacementDashboard from './pages/dashboards/PlacementDashboard';
import PlacementOpportunities from './pages/dashboards/PlacementOpportunities';
import PlacementApplications from './pages/dashboards/PlacementApplications';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Open Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Role Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/skills-projects" element={<StudentSkillsProjects />} />
            <Route path="/student/opportunities" element={<StudentOpportunities />} />
            <Route path="/student/applications" element={<StudentApplications />} />
          </Route>

          {/* Faculty / Mentor Role Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/cohorts" element={<FacultyCohorts />} />
            <Route path="/faculty/opportunities" element={<FacultyOpportunities />} />
          </Route>

          {/* Placement Officer & Admin Role Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['placement_officer', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/placement/dashboard" element={<PlacementDashboard />} />
            <Route path="/placement/opportunities" element={<PlacementOpportunities />} />
            <Route path="/placement/applications" element={<PlacementApplications />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
