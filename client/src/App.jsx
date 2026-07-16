import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ToastProvider from './components/common/ToastProvider';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Root redirect based on role
const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'donor':
      return <Navigate to="/donor" />;
    case 'ngo':
      return <Navigate to="/ngo" />;
    case 'admin':
      return <Navigate to="/admin" />;
    default:
      return <Navigate to="/login" />;
  }
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/donor"
        element={
          <ProtectedRoute allowedRoles={['donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ngo"
        element={
          <ProtectedRoute allowedRoles={['ngo']}>
            <NgoDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <ToastProvider />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;