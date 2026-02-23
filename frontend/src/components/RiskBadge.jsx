const styles = {
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  High: 'bg-red-100 text-red-800 border-red-200',
  Critical: 'bg-red-200 text-red-900 border-red-300',
};

export default function RiskBadge({ level, color }) {
  const s = color === 'green' && 'bg-emerald-100 text-emerald-800 border-emerald-200'
    || color === 'orange' && 'bg-amber-100 text-amber-800 border-amber-200'
    || color === 'red' && 'bg-red-100 text-red-800 border-red-200'
    || color === 'darkred' && 'bg-red-200 text-red-900 border-red-300'
    || styles[level]
    || 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s}`}>
      {level}
    </span>
  );
}
