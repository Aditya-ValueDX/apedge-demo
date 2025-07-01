import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Ban,
  FileSearch,
  FileCheck2,
  ClipboardList,
  FileX,
} from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/dashboard-stats');
        const data = await res.json();
        console.log("📊 Dashboard API response:", data);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  const renderCard = (icon, label, value, color) => (
    <div className="card">
      <div className="icon-box" style={{ backgroundColor: color + '20' }}>
        {React.createElement(icon, { size: 28, color })}
      </div>
      <div className="value" style={{ color }}>{value}</div>
      <div className="label">{label}</div>
    </div>
  );

  if (!stats) return <p className="loading">Loading dashboard...</p>;

  const sectionConfig = [
    {
      title: 'Invoice Status Overview',
      items: [
        { label: 'Invoice Uploaded', value: stats.invoiceUploaded, icon: UploadCloud, color: '#3498db' },
        { label: 'For Review', value: stats.invoiceDraft, icon: FileSearch, color: '#f39c12' },
        { label: 'Review Completed', value: stats.invoiceReviewed, icon: CheckCircle, color: '#2ecc71' },
        { label: 'Rejected', value: stats.invoiceRejected, icon: FileX, color: '#e74c3c' },
      ],
    },
    {
      title: 'Reconciliation Status Overview',
      items: [
        { label: 'For Review', value: stats.reconDraft, icon: FileSearch, color: '#f39c12' },
        { label: 'Review Completed', value: stats.reconCompleted, icon: CheckCircle, color: '#2ecc71' },
        { label: 'Rejected', value: stats.reconRejected, icon: FileX, color: '#e74c3c' },
      ],
    },
    {
      title: 'Final Summary',
      items: [
        { label: 'Invoice Review Completed', value: stats.invoiceReviewed, icon: CheckCircle, color: '#2ecc71' },
        { label: 'Reconciliation Completed', value: stats.reconCompleted, icon: FileCheck2, color: '#27ae60' },
        { label: 'Rejected', value: stats.invoiceRejected + stats.reconRejected, icon: Ban, color: '#c0392b' },
      ],
    },
  ];

  const pieData = {
    labels: ['Uploaded', 'Review Completed', 'Rejected'],
    datasets: [
      {
        data: [stats.invoiceUploaded, stats.invoiceReviewed, stats.invoiceRejected],
        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c'],
        borderColor: ['#2980b9', '#27ae60', '#c0392b'],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: ['Invoice Review', 'Reconciliation'],
    datasets: [
      {
        label: 'Completed',
        data: [stats.invoiceReviewed, stats.reconCompleted],
        backgroundColor: '#2ecc71',
        borderRadius: 6,
      },
      {
        label: 'Rejected',
        data: [stats.invoiceRejected, stats.reconRejected],
        backgroundColor: '#e74c3c',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="dashboard">
      {sectionConfig.map((section, i) => (
        <div className="dashboard-section" key={i}>
          <h2 className="section-heading">{section.title}</h2>
          <div className="stats-grid">
            {section.items.map((stat, index) => renderCard(stat.icon, stat.label, stat.value, stat.color))}
          </div>
        </div>
      ))}

      <div className="dashboard-section visual-insights">
        <h2 className="section-heading" style={{textAlign:'left'}}>Visual Insights</h2>
        <div className="chart-grid">
          <div className="chart-box">
            <h4>Invoice Distribution</h4>
            <div className="chart-wrapper">
              <Pie data={pieData} options={{
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#34495e',
                      font: { size: 13 }
                    }
                  }
                }
              }} />
            </div>
          </div>
          <div className="chart-box">
            <h4>Review Outcomes</h4>
            <div className="chart-wrapper">
              <Bar data={barData} options={{
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#34495e',
                      font: { size: 13 }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                      color: '#6b7280'
                    },
                    grid: {
                      color: '#e5e7eb'
                    }
                  },
                  x: {
                    ticks: {
                      color: '#6b7280'
                    },
                    grid: {
                      display: false
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          padding: 30px 30px 30px 70px;
          font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);

        }

        .dashboard-section {
          margin-bottom: 50px;
        }

        .section-heading {
          font-size: 22px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
          position: relative;
        }

        .section-heading::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -6px;
          height: 3px;
          width: 50px;
          background: #6366f1;
          border-radius: 2px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }

        .card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          text-align: center;
          border: 1px solid #e0e6ed;
          transition: transform 0.3s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.1);
        }

        .icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          margin: 0 auto 14px;
          border-radius: 50%;
        }

        .value {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .label {
          font-size: 14px;
          color: #7f8c8d;
        }

       .visual-insights {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 18px;
  padding: 20px 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid #e5e7eb;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
}

.chart-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 36px;
  margin-top: 30px;
}

.chart-box {
  width: 100%;
  max-width: 500px;
  background: white;
  padding: 24px;
  border-radius: 14px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
  text-align: center;
}

.chart-box:hover {
  transform: translateY(-4px);
}

.chart-box h4 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 18px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  max-width: 80%;
  height: auto;
  padding: 10px 0;
}


      `}</style>
    </div>
  );
};

export default Dashboard;
