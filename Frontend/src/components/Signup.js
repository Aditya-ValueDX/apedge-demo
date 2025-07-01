import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/global.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    contact: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSignup = async () => {
    const { companyName, email, contact, password } = form;

    if (!companyName || !email || !contact || !password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/signup/', form);
      const data = res.data;

      const role = data.role || 'user';

      // Store in sessionStorage
      sessionStorage.setItem('user', JSON.stringify({
        id: data.id,
        companyName: data.companyName,
        email: data.email,
        role: role
      }));

      toast.success('Signup successful!', {
        position: 'top-center',
        autoClose: 2000,
        onClose: () => navigate('/dashboard'),
      });
    } catch (err) {
      console.error('Signup error:', err);
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
        <h2 className="auth-title">Signup</h2>

        <div className="auth-field">
          <i className="fas fa-building"></i>
          <input
            type="text"
            name="companyName"
            placeholder="Company Name"
            value={form.companyName}
            onChange={handleChange}
          />
        </div>

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
          <i className="fas fa-phone"></i>
          <input
            type="text"
            name="contact"
            placeholder="Contact Number"
            value={form.contact}
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

        <button onClick={handleSignup} disabled={loading}>
          {loading ? <div className="loader"></div> : 'Signup'}
        </button>

        <div className="auth-link">
          <p onClick={() => navigate('/login')}>Already have an account? Login</p>
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

export default Signup;
