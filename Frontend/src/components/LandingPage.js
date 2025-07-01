import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="brand-name">AP<span>Auto</span></div>
        <nav className="landing-nav">
          <button onClick={() => navigate('/login')}>Login</button>
          <button className="signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Smarter AP Automation for Your Business</h1>
            <p>
              Accelerate your invoice approvals, improve accuracy, and gain complete visibility with our intelligent AP Automation solution.
            </p>
            <button className="cta-button" onClick={() => navigate('/signup')}>
              Start Free Trial
            </button>
          </div>
          <div className="hero-image">
            <img src="https://cdn-icons-png.flaticon.com/512/3250/3250178.png" alt="Automation" />
          </div>
        </section>

        <section className="features-section">
          <div className="feature-card">
            <h3>AI-Powered OCR</h3>
            <p>Extract invoice data automatically and accurately using intelligent document scanning.</p>
          </div>
          <div className="feature-card">
            <h3>Real-Time Status</h3>
            <p>Track your invoice approvals and payment schedules with full transparency.</p>
          </div>
          <div className="feature-card">
            <h3>Seamless Integration</h3>
            <p>Integrates effortlessly with your ERP, email, and accounting tools.</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        © {new Date().getFullYear()} AP Automation System · Built with ❤️ for enterprises.
      </footer>
    </div>
  );
};

export default LandingPage;
