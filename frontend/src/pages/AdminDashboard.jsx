import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import TopNav from '../components/TopNav';
import Spinner from '../components/Spinner';

const CHART_COLORS = {
  primary: '#6F1D1B',
  secondary: '#BB9457',
  dark: '#432818',
  light: '#FFE6A7',
  warm: '#99582A',
};

const DISEASE_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.warm, '#7B4B94'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/admin/stats/');
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          const msg = err.response?.data?.detail || err.response?.status === 403
            ? 'Admin access required.'
            : 'Failed to load stats.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="p-6 max-w-4xl mx-auto">
          <div className="bg-light rounded-2xl border border-secondary/40 p-8 text-center">
            <p className="text-content font-medium">{error || 'No data available.'}</p>
          </div>
        </main>
      </div>
    );
  }

  const pieData = [
    { name: 'Heart', value: stats.predictions_by_disease?.heart ?? 0 },
    { name: 'Diabetes', value: stats.predictions_by_disease?.diabetes ?? 0 },
    { name: 'Stroke', value: stats.predictions_by_disease?.stroke ?? 0 },
    { name: 'Hypertension', value: stats.predictions_by_disease?.hypertension ?? 0 },
  ].filter((d) => d.value > 0);
  if (pieData.length === 0) pieData.push({ name: 'No data', value: 1 });

  const riskBarData = [
    { name: 'Low', count: stats.predictions_by_risk_level?.Low ?? 0 },
    { name: 'Moderate', count: stats.predictions_by_risk_level?.Moderate ?? 0 },
    { name: 'High', count: stats.predictions_by_risk_level?.High ?? 0 },
    { name: 'Critical', count: stats.predictions_by_risk_level?.Critical ?? 0 },
  ];

  const dailyData = (stats.daily_predictions || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: d.count,
    full: d.date,
  }));

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-content mb-1">Admin Dashboard</h1>
        <p className="text-content/70 text-sm mb-6">System-wide statistics and recent activity</p>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-light rounded-2xl shadow-card p-6 border border-secondary/40">
            <p className="text-sm font-medium text-content/70 mb-1">Total Patients</p>
            <p className="font-heading text-3xl font-bold text-primary">{stats.total_patients ?? 0}</p>
          </div>
          <div className="bg-light rounded-2xl shadow-card p-6 border border-secondary/40">
            <p className="text-sm font-medium text-content/70 mb-1">Total Health Providers</p>
            <p className="font-heading text-3xl font-bold text-primary">{stats.total_providers ?? 0}</p>
          </div>
          <div className="bg-light rounded-2xl shadow-card p-6 border border-secondary/40">
            <p className="text-sm font-medium text-content/70 mb-1">Total Predictions</p>
            <p className="font-heading text-3xl font-bold text-primary">{stats.total_predictions ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Predictions by disease (Pie) */}
          <div className="bg-light rounded-2xl shadow-card p-6 border border-secondary/40">
            <h2 className="font-heading font-semibold text-content mb-4">Predictions by disease</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => (value > 0 ? `${name}: ${value}` : null)}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={DISEASE_COLORS[i % DISEASE_COLORS.length]} stroke={CHART_COLORS.dark} strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_COLORS.light,
                      border: `1px solid ${CHART_COLORS.secondary}`,
                      borderRadius: '0.75rem',
                    }}
                    formatter={(value) => [value, 'Predictions']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predictions by risk level (Bar) */}
          <div className="bg-light rounded-2xl shadow-card p-6 border border-secondary/40">
            <h2 className="font-heading font-semibold text-content mb-4">Predictions by risk level</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.secondary} strokeOpacity={0.3} />
                  <XAxis dataKey="name" stroke={CHART_COLORS.dark} fontSize={12} />
                  <YAxis stroke={CHART_COLORS.dark} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_COLORS.light,
                      border: `1px solid ${CHART_COLORS.secondary}`,
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Predictions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Growth curve — daily predictions */}
        <div className="bg-light rounded-2xl shadow-card p-6 border border-secondary/40 mb-8">
          <h2 className="font-heading font-semibold text-content mb-4">Growth Curve — Predictions per day</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.secondary} strokeOpacity={0.3} />
                <XAxis dataKey="date" stroke={CHART_COLORS.dark} fontSize={12} />
                <YAxis stroke={CHART_COLORS.dark} fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.light,
                    border: `1px solid ${CHART_COLORS.secondary}`,
                    borderRadius: '0.75rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.primary, r: 3 }}
                  name="Predictions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent registrations table */}
        <div className="bg-light rounded-2xl shadow-card border border-secondary/40 overflow-hidden">
          <h2 className="font-heading font-semibold text-content p-6 pb-0 mb-3">Recent registrations</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary/40 bg-secondary/5">
                  <th className="text-left py-3 px-4 text-sm font-medium text-content">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-content">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-content">Date joined</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recent_registrations || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-content/70 text-sm">
                      No registrations yet
                    </td>
                  </tr>
                ) : (
                  (stats.recent_registrations || []).map((r, i) => (
                    <tr key={i} className="border-b border-secondary/30 hover:bg-secondary/5">
                      <td className="py-3 px-4 text-sm text-content font-medium">{r.username}</td>
                      <td className="py-3 px-4 text-sm text-content capitalize">{r.role}</td>
                      <td className="py-3 px-4 text-sm text-content/80">
                        {r.date_joined ? new Date(r.date_joined).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '–'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
