import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/global.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const navigate = useNavigate();
  const doesTableExist = (localStorage.getItem("table_config_generated") === "true");

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/login/', {
        email: form.email,
        password: form.password,
      });

      const data = res.data;
      const role = data.role || 'user';

      // Save to sessionStorage
      sessionStorage.setItem('user', JSON.stringify({
        name: data.name,
        id: data.id,
        companyName: data.companyName,
        email: data.email,
        role: role,
        adminId: data.adminId
      }));

      // toast.success('Login successful!', {
      //   position: 'top-center',
      //   autoClose: 2000,
      //   onClose: () => navigate('/dashboard'),
      // });
      toast.success('Login successful!', {
  position: 'top-center',
  autoClose: 2000,
  onClose: () => {
    if (doesTableExist) {
      navigate('/dashboard');
    } else if (!doesTableExist && role === "Administrator") {
      navigate('/admin');
    } else {
      alert("🚫 Login Successful, but process not configured. Please contact your Manager.");
    }
  }
});
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>

        <div className="auth-field">
          <i className="fas fa-envelope"></i>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="auth-field">
          <i className="fas fa-lock"></i>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <span
            className="password-toggle-text"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button onClick={handleLogin} disabled={loading}>
          {loading ? <div className="loader"></div> : 'Login'}
        </button>

        <div className="auth-link">
          <p onClick={() => navigate('/signup')}>Don’t have an account? Signup</p>
          <p onClick={() => navigate('/')}>← Back to Home</p>
        </div>
      </div>

      <div className="floating-shape shape1"></div>
      <div className="floating-shape shape2"></div>
      <div className="floating-shape shape3"></div>

      <ToastContainer />
    </div>
  );
};

export default Login;