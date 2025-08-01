import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useDispatch } from 'react-redux'; // Import useDispatch
import { authActions } from '../redux/store'; // Import your auth actions
import { USER_ROLES, API_BASE_URL } from '../utils/config';

const Auth = () => { // onLogin prop is no longer needed here
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.REQUESTER);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch(); // Get the dispatch function

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await axios.post(API_BASE_URL + url, {
        email,
        password,
        role: selectedRole,
      });

      toast.success(`${isLogin ? 'Login' : 'Signup'} successful!`, {
        position: 'top-right',
        autoClose: 3000,
      });

      // Dispatch login action with user data
      // The backend's login endpoint should return { id, email, role }
      dispatch(authActions.login(response.data));

      // No need for setTimeout or onLogin prop anymore, Redux handles navigation via App.js
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong';
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
      });
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? 'Welcome Back!' : 'Join ReimbursePro'}
        </h2>
        <form onSubmit={handleSubmit} className="auth-form-grid">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role" className="form-label">Select Your Role (Mock)</label>
            <select
              id="role"
              className="form-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value={USER_ROLES.REQUESTER}>Requester</option>
              <option value={USER_ROLES.APPROVER}>Approver</option>
              <option value={USER_ROLES.ADMIN}>Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>
        <p className="auth-toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="auth-toggle-button"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      {/* Toast messages */}
      <ToastContainer />
    </div>
  );
};

export default Auth;
