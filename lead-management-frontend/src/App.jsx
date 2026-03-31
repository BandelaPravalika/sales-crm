import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentPortal from './pages/PaymentPortal';
import AssociateDashboard from './pages/AssociateDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/pay/:sessionId" element={<PaymentPortal />} />
          
          <Route 
            path="/manager/*" 
            element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/tl/*" 
            element={
              <ProtectedRoute allowedRoles={['TEAM_LEADER']}>
                <TeamLeaderDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/associate/*" 
            element={
              <ProtectedRoute allowedRoles={['ASSOCIATE', 'ASSOCIATE_TEAM_LEAD']}>
                <AssociateDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/" 
            element={
              user ? (
                user.role === 'ADMIN' ? 
                  <Navigate to="/admin" /> : 
                  user.role === 'MANAGER' ? 
                    <Navigate to="/manager" /> : 
                    user.role === 'TEAM_LEADER' ? 
                      <Navigate to="/tl" /> : <Navigate to="/associate" />
              ) : <Navigate to="/login" />
            } 
          />
        </Routes>
      </Router>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </ThemeProvider>
  );
}

export default App;

