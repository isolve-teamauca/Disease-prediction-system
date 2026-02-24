import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, TrendingUp, AlertCircle, Copy, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';
import PredictionCard from '../components/PredictionCard';
import RiskBadge from '../components/RiskBadge';
import Spinner from '../components/Spinner';

const DISEASES = [
  { slug: 'heart', label: 'Heart Disease' },
  { slug: 'diabetes', label: 'Diabetes' },
  { slug: 'hypertension', label: 'Hypertension' },
  { slug: 'stroke', label: 'Stroke' },
];

const DISEASE_CHART_COLORS = {
  heart: '#B91C1C',
  diabetes: '#DC2626',
  hypertension: '#EF4444',
  stroke: '#991B1B',
};

/** Build chart data: one row per date, one key per disease (risk %). Latest prediction per disease per day. */
function buildHistoryChartData(predictions) {
  if (!predictions?.length) return [];
  const byDate = {};
  const sorted = [...predictions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  for (const p of sorted) {
    const dateStr = p.created_at.slice(0, 10);
    if (!byDate[dateStr]) {
      byDate[dateStr] = { date: dateStr, dateLabel: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) };
      DISEASES.forEach(({ slug }) => { byDate[dateStr][slug] = null; });
    }
    const pct = Number((Number(p.probability) * 100).toFixed(1));
    byDate[dateStr][p.disease_type] = pct;
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientCode, setPatientCode] = useState(null);

  useEffect(() => {
    api.get('/api/predictions/history/').then(({ data }) => setPredictions(Array.isArray(data) ? data : [])).catch(() => setPredictions([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/api/patients/me/').then(({ data }) => setPatientCode(data.id)).catch(() => setPatientCode(null));
  }, []);

  const copyPatientCode = () => {
    if (patientCode == null) return;
    navigator.clipboard.writeText(String(patientCode)).then(() => toast.success('Patient code copied. Share it with your doctor.'));
  };

  const sortedByDate = [...predictions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const last10 = sortedByDate.slice(0, 10);
  const recent = sortedByDate.slice(0, 5);
  const total = predictions.length;
  const lastRisk = recent[0]?.risk_level;
  const diseaseCounts = predictions.reduce((acc, p) => { acc[p.disease_type] = (acc[p.disease_type] || 0) + 1; return acc; }, {});
  const mostPredicted = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, ' ') || '–';

  const lineChartData = last10
    .map((p) => ({ created_at: p.created_at, probability: Number((Number(p.probability) * 100).toFixed(1)) }))
    .reverse();
  const showLineChart = lineChartData.length >= 2;

  const historyChartData = buildHistoryChartData(predictions);
  const hasHistoryChart = historyChartData.length > 0;

  return (
    <div className="min-h-screen relative">
      <TopNav />
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-white mb-1">
          Welcome, {user?.full_name || user?.email || 'Patient'}
        </h1>
        <p className="text-gray-300 text-sm mb-6">Track your health and run risk assessments</p>

        {patientCode != null && (
          <div className="bg-white rounded-2xl shadow-card p-4 border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Your patient code</p>
                <p className="font-heading font-mono font-bold text-lg text-content">{(patientCode)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Give this code to your doctor so they can view your predictions.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={copyPatientCode}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              <Copy className="w-4 h-4" />
              Copy code
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-card p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Predictions</p>
                <p className="font-heading font-bold text-xl">{total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Risk Level</p>
                {lastRisk ? <RiskBadge level={lastRisk} /> : <p className="font-medium">–</p>}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Most Predicted</p>
                <p className="font-heading font-semibold capitalize">{mostPredicted}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-4 border border-gray-100 mb-6">
          <h2 className="font-heading font-semibold text-lg text-content mb-3">Risk probability over time</h2>
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Spinner className="h-8 w-8" />
              <span className="text-sm">Loading prediction history...</span>
            </div>
          ) : !hasHistoryChart ? (
            <p className="text-gray-500 py-8 text-center">No prediction history yet. Run a prediction to see your risk over time.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis domain={[0, 100]} tickSuffix="%" stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length || !label) return null;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-content">
                          <p className="font-medium text-sm mb-2">{new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <ul className="text-sm space-y-1">
                            {payload.filter((e) => e.value != null).map((e) => (
                              <li key={e.dataKey} style={{ color: e.color }}>
                                {e.name}: {Number(e.value).toFixed(1)}%
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  {DISEASES.map(({ slug, label }) => (
                    <Line
                      key={slug}
                      type="monotone"
                      dataKey={slug}
                      name={label}
                      stroke={DISEASE_CHART_COLORS[slug]}
                      strokeWidth={2}
                      dot={{ fill: DISEASE_CHART_COLORS[slug], r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {showLineChart && (
          <div className="bg-white rounded-2xl shadow-card p-4 border border-gray-100 mb-6">
            <h2 className="font-heading font-semibold text-lg text-content mb-3">Probability over time (last 10)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis domain={[0, 100]} tickSuffix="%" stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleString()}
                    formatter={(value) => [`${value}%`, 'Probability']}
                  />
                  <Line type="monotone" dataKey="probability" stroke="#6F1D1B" strokeWidth={2} dot={{ fill: '#6F1D1B' }} name="Probability" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="font-heading font-semibold text-lg text-content mb-3">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {DISEASES.map(({ slug, label }) => (
              <Link
                key={slug}
                to={`/predict/${slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90"
              >
                <Activity className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-lg text-content">Recent predictions</h2>
            <Link to="/history" className="text-sm text-accent font-medium hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <Spinner className="h-8 w-8" />
              <span className="text-gray-500 text-sm">Loading recent predictions...</span>
            </div>
          ) : recent.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No predictions yet. Start with a quick action above to run your first risk assessment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((p) => (
                <PredictionCard key={p.id} disease={p.disease_type} risk_level={p.risk_level} probability={p.probability} created_at={p.created_at} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
