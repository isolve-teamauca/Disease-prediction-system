import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const RISK_COLORS = {
  Low: '#22c55e',
  Moderate: '#f97316',
  Medium: '#f97316',
  High: '#ef4444',
  Critical: '#7f1d1d',
};

export default function RiskGauge({ probability = 0, riskLevel = 'Low', size = 180 }) {
  const value = Math.min(100, Math.max(0, Number(probability) * 100));
  const fill = RISK_COLORS[riskLevel] || RISK_COLORS.Low;
  const data = [{ name: 'Risk', value, fill }];

  return (
    <div className="relative" style={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background={{ fill: '#f3f4f6' }}
            dataKey="value"
            cornerRadius={6}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-heading font-bold text-content" style={{ fontSize: '1.75rem' }}>
          {value.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
