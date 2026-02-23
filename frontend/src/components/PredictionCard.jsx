import RiskBadge from './RiskBadge';

export default function PredictionCard({ disease, risk_level, probability, created_at }) {
  const date = created_at ? new Date(created_at).toLocaleDateString() : '–';
  const diseaseLabel = disease ? disease.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '–';
  return (
    <div className="bg-light rounded-2xl shadow-card p-4 border border-secondary/40">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-heading font-semibold text-gray-900">{diseaseLabel}</p>
          <p className="text-sm text-gray-500 mt-0.5">{date}</p>
        </div>
        <RiskBadge level={risk_level} />
      </div>
      <p className="text-lg font-semibold text-primary mt-2">{probability != null ? (Number(probability) * 100).toFixed(1) : '–'}%</p>
    </div>
  );
}
