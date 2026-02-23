import { useState, useEffect } from 'react';
import api from '../api/axios';
import TopNav from '../components/TopNav';
import RiskBadge from '../components/RiskBadge';

const DISEASE_OPTIONS = ['', 'heart', 'diabetes', 'hypertension', 'stroke'];
const PER_PAGE = 10;

export default function PredictionHistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get('/api/predictions/').then(({ data }) => setPredictions(Array.isArray(data) ? data : [])).catch(() => setPredictions([])).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? predictions.filter((p) => p.disease_type === filter) : predictions;
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(currentPage * PER_PAGE, (currentPage + 1) * PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-content mb-1">Prediction History</h1>
        <p className="text-gray-500 text-sm mb-6">All your risk assessments</p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by disease</span>
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(0); }}
              className="bg-input rounded-xl border border-secondary/50 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {DISEASE_OPTIONS.map((d) => (
                <option key={d} value={d}>{d || 'All'}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="bg-light rounded-2xl shadow-card border border-secondary/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary/50 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Disease Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk Level</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Probability</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-8 text-center">Loading...</td></tr>
                ) : slice.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No predictions yet</td></tr>
                ) : (
                  slice.map((p) => (
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between py-3 px-4 border-t border-secondary/40">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-1.5 rounded-lg border border-secondary/50 text-content text-sm disabled:opacity-50 hover:bg-secondary/10">
                Previous
              </button>
              <span className="text-sm text-content/80">Page {currentPage + 1} of {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-3 py-1.5 rounded-lg border border-secondary/50 text-content text-sm disabled:opacity-50 hover:bg-secondary/10">
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
