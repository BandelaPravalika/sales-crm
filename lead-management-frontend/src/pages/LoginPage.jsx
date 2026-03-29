import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ShieldCheck, 
  UserCog, 
  Users, 
  User, 
  Sparkles 
} from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = (role) => {
    try {
      const user = loginDemo(role);
      toast.success(`Logged in as ${role}`);
      
      // role-based redirect
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'MANAGER') navigate('/manager');
      else if (role === 'TEAM_LEADER') navigate('/tl');
      else if (role === 'ASSOCIATE') navigate('/associate');
      else navigate('/');
    } catch (err) {
      toast.error('Demo login failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error('All fields required');
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return toast.error('Invalid email');
    }

    try {
      setLoading(true);
      const user = await login(email, password);

      toast.success('Login successful');

      // role-based redirect
      if (user?.role === 'ADMIN') navigate('/admin');
      else if (user?.role === 'STUDENT') navigate('/student');
      else navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center bg-dark">

      <div className="card shadow-lg p-4" style={{ width: '380px', borderRadius: '12px' }}>

        <div className="text-center mb-4">
          <h3 className="fw-bold">Welcome Back</h3>
          <p className="text-muted">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@lms.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password with toggle */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                type={show ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShow(!show)}
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <div className="mt-4">
          <div className="d-flex align-items-center mb-3">
            <div className="flex-grow-1 border-bottom border-secondary-subtle"></div>
            <div className="mx-3 text-muted small fw-medium">DEMO ACCESS</div>
            <div className="flex-grow-1 border-bottom border-secondary-subtle"></div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <button 
                onClick={() => handleDemoLogin('ADMIN')}
                className="btn btn-outline-dark w-100 py-2 d-flex flex-column align-items-center gap-1 border-opacity-10"
                style={{ fontSize: '12px' }}
              >
                <ShieldCheck size={18} className="text-primary" />
                <span>Admin</span>
              </button>
            </div>
            <div className="col-6">
              <button 
                onClick={() => handleDemoLogin('MANAGER')}
                className="btn btn-outline-dark w-100 py-2 d-flex flex-column align-items-center gap-1 border-opacity-10"
                style={{ fontSize: '12px' }}
              >
                <UserCog size={18} className="text-info" />
                <span>Manager</span>
              </button>
            </div>
            <div className="col-6">
              <button 
                onClick={() => handleDemoLogin('TEAM_LEADER')}
                className="btn btn-outline-dark w-100 py-2 d-flex flex-column align-items-center gap-1 border-opacity-10"
                style={{ fontSize: '12px' }}
              >
                <Users size={18} className="text-success" />
                <span>Team Lead</span>
              </button>
            </div>
            <div className="col-6">
              <button 
                onClick={() => handleDemoLogin('ASSOCIATE')}
                className="btn btn-outline-dark w-100 py-2 d-flex flex-column align-items-center gap-1 border-opacity-10"
                style={{ fontSize: '12px' }}
              >
                <User size={18} className="text-warning" />
                <span>Associate</span>
              </button>
            </div>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-muted" style={{ fontSize: '10px' }}>
              <Sparkles size={10} className="me-1" />
              Bypass backend for UI demonstration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;