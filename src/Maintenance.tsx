import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

export default function Maintenance() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'performance' | 'models' | 'training' | 'config' | 'audit'>('performance');

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const metrics = [
    {
      label: 'Overall Accuracy',
      value: '94.2%',
      change: '+2.3% vs last month',
      changeType: 'positive' as const,
      icon: '🎯'
    },
    {
      label: 'Cases Processed',
      value: '12,487',
      change: '+18% vs last month',
      changeType: 'positive' as const,
      subtext: '(30d)',
      icon: '📊'
    },
    {
      label: 'Avg Processing Time',
      value: '2.4s',
      change: '-0.3s vs last month',
      changeType: 'positive' as const,
      icon: '⚡'
    },
    {
      label: 'Uptime',
      value: '98.7%',
      change: '+0.2% vs last month',
      changeType: 'positive' as const,
      icon: '✓'
    }
  ];

  const fieldAccuracy = [
    { field: 'Tumor Size', accuracy: 94, confidence: 'high', cases: 1247 },
    { field: 'Histologic Type', accuracy: 98, confidence: 'high', cases: 1247 },
    { field: 'Histologic Grade', accuracy: 92, confidence: 'high', cases: 1247 },
    { field: 'Lymphovascular Invasion', accuracy: 68, confidence: 'low', cases: 1247, alert: true },
    { field: 'Margin Status', accuracy: 91, confidence: 'high', cases: 1247 },
    { field: 'ER Status', accuracy: 96, confidence: 'high', cases: 856 },
    { field: 'PR Status', accuracy: 95, confidence: 'high', cases: 856 },
    { field: 'HER2 Status', accuracy: 97, confidence: 'high', cases: 856 }
  ];

  const recentActivity = [
    { time: '2 hours ago', event: 'Nightly batch completed', details: '127 synoptics generated', status: 'success' },
    { time: '5 hours ago', event: 'Model accuracy threshold alert', details: 'Lymphovascular invasion: 68%', status: 'warning' },
    { time: '1 day ago', event: 'Template version updated', details: 'CAP Breast 4.3.0.1 → 4.4.0.0', status: 'info' },
    { time: '2 days ago', event: 'Training data uploaded', details: '450 new validated cases', status: 'success' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Navigation */}
      <nav
        style={{
          background: 'white',
          borderBottom: '2px solid #e2e8f0',
          padding: '12px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <svg
            width="160"
            height="50"
            viewBox="0 0 700 200"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <defs>
              <linearGradient id="logoGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#0891B2', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0E7490', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <polygon 
              points="100,30 165,65 165,135 100,170 35,135 35,65" 
              fill="url(#logoGrad3)" 
              stroke="#0E7490" 
              strokeWidth="3"
            />
            <circle cx="100" cy="100" r="42" fill="#FFFFFF" stroke="#0E7490" strokeWidth="3"/>
            <rect x="78" y="80" width="44" height="40" rx="2.5" fill="none" stroke="#0891B2" strokeWidth="2.5"/>
            <line x1="84" y1="88" x2="116" y2="88" stroke="#0891B2" strokeWidth="2" strokeLinecap="round"/>
            <line x1="84" y1="96" x2="116" y2="96" stroke="#0891B2" strokeWidth="2" strokeLinecap="round"/>
            <line x1="84" y1="104" x2="102" y2="104" stroke="#0891B2" strokeWidth="2" strokeLinecap="round"/>
            <polyline 
              points="84,111 91,116 116,94" 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <text 
              x="200" 
              y="125" 
              fontFamily="'Inter', 'Segoe UI', Roboto, sans-serif" 
              fontSize="72" 
              fontWeight="700" 
              fill="#1E293B"
            >
              PathScribe
              <tspan fontSize="36" fill="#0891B2" dy="-22" dx="6">AI</tspan>
            </text>
          </svg>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#64748b',
                borderRadius: '6px'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/worklist')}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#64748b',
                borderRadius: '6px'
              }}
            >
              Worklist
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: '#fef3c7',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: '#92400e',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>⚙️</span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              System Admin
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            {user?.initials}
          </div>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: '#64748b'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}
          >
            Model Performance Dashboard
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
            Monitor AI model accuracy and system health
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px 12px 0 0',
            border: '1px solid #e2e8f0',
            borderBottom: 'none',
            padding: '0 24px',
            display: 'flex',
            gap: '32px'
          }}
        >
          {(['performance', 'models', 'training', 'config', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #0891B2' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: activeTab === tab ? '#0891B2' : '#64748b',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'training' ? 'Training Data' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          style={{
            background: 'white',
            borderRadius: '0 0 12px 12px',
            border: '1px solid #e2e8f0',
            padding: '32px'
          }}
        >
          {activeTab === 'performance' && (
            <div>
              {/* Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '20px',
                  marginBottom: '32px'
                }}
              >
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>
                      {metric.icon}
                    </div>
                    <div
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#1e293b',
                        marginBottom: '4px'
                      }}
                    >
                      {metric.value}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '8px'
                      }}
                    >
                      {metric.label}
                      {metric.subtext && (
                        <span style={{ fontWeight: 400 }}> {metric.subtext}</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: metric.changeType === 'positive' ? '#10b981' : '#ef4444'
                      }}
                    >
                      {metric.changeType === 'positive' ? '↑' : '↓'} {metric.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alert */}
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde047',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '32px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#92400e',
                        marginBottom: '6px'
                      }}
                    >
                      Model Retraining Recommended
                    </div>
                    <div style={{ fontSize: '14px', color: '#78350f' }}>
                      Accuracy for lymphovascular invasion detection has dropped to 68% (below 75%
                      threshold). Review training data and consider model retraining.
                    </div>
                  </div>
                </div>
                <button
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#92400e',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Review Data
                </button>
              </div>

              {/* Field Accuracy Table */}
              <div>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#1e293b'
                  }}
                >
                  Field-Level Accuracy
                </h2>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Field Name
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Accuracy
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Confidence
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Cases Analyzed
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieldAccuracy.map((field, idx) => (
                        <tr
                          key={field.field}
                          style={{
                            borderBottom:
                              idx === fieldAccuracy.length - 1 ? 'none' : '1px solid #e2e8f0',
                            background: field.alert ? '#fef3c7' : 'transparent'
                          }}
                        >
                          <td
                            style={{
                              padding: '16px',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#1e293b'
                            }}
                          >
                            {field.alert && (
                              <span style={{ marginRight: '6px' }}>⚠️</span>
                            )}
                            {field.field}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '120px',
                                  height: '8px',
                                  background: '#e2e8f0',
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${field.accuracy}%`,
                                    height: '100%',
                                    background:
                                      field.accuracy >= 90
                                        ? '#10b981'
                                        : field.accuracy >= 75
                                        ? '#f59e0b'
                                        : '#ef4444',
                                    borderRadius: '4px'
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color:
                                    field.accuracy >= 90
                                      ? '#10b981'
                                      : field.accuracy >= 75
                                      ? '#f59e0b'
                                      : '#ef4444'
                                }}
                              >
                                {field.accuracy}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                background:
                                  field.confidence === 'high' ? '#d1fae5' : '#fecaca',
                                color:
                                  field.confidence === 'high' ? '#065f46' : '#991b1b',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {field.confidence}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '16px',
                              fontSize: '14px',
                              color: '#64748b'
                            }}
                          >
                            {field.cases.toLocaleString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {field.alert ? (
                              <span
                                style={{
                                  padding: '4px 8px',
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  borderRadius: '4px'
                                }}
                              >
                                NEEDS REVIEW
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '4px 8px',
                                  background: '#d1fae5',
                                  color: '#065f46',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  borderRadius: '4px'
                                }}
                              >
                                ✓ HEALTHY
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ marginTop: '32px' }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#1e293b'
                  }}
                >
                  Recent Activity
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background:
                              activity.status === 'success'
                                ? '#d1fae5'
                                : activity.status === 'warning'
                                ? '#fef3c7'
                                : '#dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                          }}
                        >
                          {activity.status === 'success'
                            ? '✓'
                            : activity.status === 'warning'
                            ? '⚠️'
                            : 'ℹ️'}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#1e293b',
                              marginBottom: '2px'
                            }}
                          >
                            {activity.event}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            {activity.details}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'performance' && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
              </div>
              <div style={{ fontSize: '14px' }}>
                This section is under development
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
