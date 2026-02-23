import { useState } from 'react';
import { Search, BarChart3, Calendar, AlertTriangle, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import api from '../api/axios';
import TopNav from '../components/TopNav';
import RiskBadge from '../components/RiskBadge';
import Spinner from '../components/Spinner';

export default function ProviderDashboard() {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const id = query.trim();
    if (!id) return;
    setLoading(true);
    setSearched(true);
    setPatientDetails(null);
    try {
      const { data } = await api.get('/api/predictions/', { params: { patient_id: id } });
      const list = Array.isArray(data) ? data : [];
      setPredictions(list);
      try {
        const { data: patient } = await api.get('/api/patients/', { params: { patient_id: id } });
        setPatientDetails(patient);
      } catch {
        setPatientDetails(null);
      }
    } catch (err) {
      setPredictions([]);
      setPatientDetails(null);
      const msg = err.response?.data?.detail ?? err.response?.data?.error ?? 'Failed to load patient predictions.';
      toast.error(typeof msg === 'string' ? msg : 'Failed to load patient predictions.');
    } finally {
      setLoading(false);
    }
  };

  const copyPatientId = () => {
    if (!query.trim()) return;
    navigator.clipboard.writeText(query.trim()).then(() => toast.success('Patient ID copied'));
  };

  const initials = patientDetails?.full_name
    ? patientDetails.full_name.trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2)
    : patientDetails?.email?.[0]?.toUpperCase() ?? '?';

  const byDisease = predictions.reduce((acc, p) => {
    const key = String(p.disease_type).replace(/_/g, ' ');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(byDisease).map(([name, count]) => ({ name, count }));

  // Analytics: summary and risk % by disease (latest probability per disease)
  const sortedByDate = [...predictions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const lastPredictionDate = sortedByDate[0]?.created_at;
  const highestRisk = sortedByDate.length
    ? sortedByDate.reduce((best, p) => (Number(p.probability) > Number(best.probability) ? p : best), sortedByDate[0])
    : null;
  const highestRiskLabel = highestRisk ? `${String(highestRisk.disease_type).replace(/_/g, ' ')}: ${(Number(highestRisk.probability) * 100).toFixed(1)}%` : '–';

  const latestByDisease = predictions.reduce((acc, p) => {
    const key = p.disease_type;
    const existing = acc[key];
    if (!existing || new Date(p.created_at) > new Date(existing.created_at)) acc[key] = p;
    return acc;
  }, {});
  const riskByDiseaseData = Object.entries(latestByDisease).map(([disease, p]) => ({
    name: String(disease).replace(/_/g, ' '),
    probability: Number((Number(p.probability) * 100).toFixed(1)),
  }));

  const exportCsv = () => {
    const patientId = query.trim() || 'unknown';
    const headers = ['Date', 'Disease', 'Risk Probability', 'Risk Level', 'Prediction'];
    const rows = predictions.map((p) => [
      new Date(p.created_at).toLocaleString(),
      String(p.disease_type).replace(/_/g, ' '),
      `${(Number(p.probability) * 100).toFixed(1)}%`,
      p.risk_level ?? '',
      Number(p.prediction) === 1 ? 'Positive' : 'Negative',
    ]);
    const escape = (v) => {
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_${patientId}_History.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-content mb-1">Health Provider Dashboard</h1>
        <p className="text-gray-500 text-sm mb-6">Enter the patient&apos;s code (they can find it on their dashboard) to view their prediction history</p>

        <form onSubmit={handleSearch} className="max-w-xl mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Enter patient code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-input rounded-xl border border-secondary/50 py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-light px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
              {loading ? <><Spinner className="h-4 w-4 border-2" /> Searching...</> : 'Search'}
            </button>
          </div>
        </form>

        {searched && patientDetails && (
          <div className="mb-6 bg-light rounded-2xl shadow-card border border-secondary/40 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-light font-heading font-bold text-lg shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-semibold text-lg text-content">{patientDetails.full_name || 'Patient'}</h2>
                {patientDetails.email && (
                  <p className="text-sm text-content/70 mt-0.5">{patientDetails.email}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Patient ID</span>
                    <code className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">{patientDetails.id}</code>
                    <button
                      type="button"
                      onClick={copyPatientId}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-secondary/20 hover:text-primary transition-colors"
                      title="Copy Patient ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {patientDetails.date_joined && (
                    <span className="text-sm text-gray-500">
                      Member since {new Date(patientDetails.date_joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-sm font-medium text-primary">
                    {patientDetails.total_predictions} prediction{patientDetails.total_predictions !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {searched && (
          <>
            <section className="mb-6" aria-label="Analytics">
              <h2 className="font-heading font-semibold text-lg text-content mb-3">Analytics</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-light rounded-2xl shadow-card p-4 border border-secondary/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total predictions</p>
                      <p className="font-heading font-bold text-xl">{predictions.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-light rounded-2xl shadow-card p-4 border border-secondary/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Highest risk disease</p>
                      <p className="font-heading font-semibold text-content capitalize">{highestRiskLabel}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-light rounded-2xl shadow-card p-4 border border-secondary/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last prediction</p>
                      <p className="font-heading font-semibold text-content">
                        {lastPredictionDate ? new Date(lastPredictionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '–'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {riskByDiseaseData.length > 0 && (
                <div className="bg-light rounded-2xl shadow-card p-4 border border-secondary/40 mb-6">
                  <h3 className="font-heading font-semibold text-content mb-3">Risk probability by disease (latest per disease)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskByDiseaseData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis domain={[0, 100]} tickSuffix="%" stroke="#6b7280" fontSize={12} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Risk']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
                        <Bar dataKey="probability" fill="#B91C1C" radius={[4, 4, 0, 0]} name="Risk %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {barData.length > 0 && (
                <div className="bg-light rounded-2xl shadow-card p-4 border border-secondary/40 mb-6">
                  <h3 className="font-heading font-semibold text-content mb-3">Predictions by disease (count)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip formatter={(value) => [value, 'Count']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
                        <Bar dataKey="count" fill="#B91C1C" radius={[4, 4, 0, 0]} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        <div className="bg-light rounded-2xl shadow-card border border-secondary/40 overflow-hidden">
          {searched && predictions.length > 0 && (
            <div className="flex justify-end py-3 px-4 border-b border-secondary/40">
              <button
                type="button"
                onClick={exportCsv}
                className="bg-primary text-light px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
              >
                Export CSV
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary/50 bg-secondary/5">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Disease</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk Level</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Probability</th>
                </tr>
              </thead>
              <tbody>
                {!searched ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">Enter the patient&apos;s code and click Search to view their prediction history.</td></tr>
                ) : loading ? (
                  <tr><td colSpan={4} className="py-8 text-center"><div className="flex flex-col items-center justify-center gap-3"><Spinner className="h-8 w-8" /><span className="text-gray-500 text-sm">Loading predictions...</span></div></td></tr>
                ) : predictions.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No predictions found for this patient. They may not have run any risk assessments yet.</td></tr>
                ) : (
                  predictions.map((p) => (
                    <tr key={p.id} className="border-b border-secondary/40 hover:bg-secondary/5">
                      <td className="py-3 px-4 text-sm text-gray-700">{new Date(p.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm font-medium capitalize">{String(p.disease_type).replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4"><RiskBadge level={p.risk_level} /></td>
                      <td className="py-3 px-4 text-sm text-accent font-medium">{(Number(p.probability) * 100).toFixed(1)}%</td>
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
