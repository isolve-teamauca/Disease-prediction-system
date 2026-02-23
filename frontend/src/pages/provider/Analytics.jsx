import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import { apiGet } from "../../lib/api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#06b6d4", "#6366f1"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("Last 6 Months");

  useEffect(() => {
    apiGet("/api/provider/analytics").then(setData);
  }, []);

  const trends = useMemo(() => {
    if (!data) return [];
    const m = data.assessmentTrends.months;
    return m.map((month, i) => ({
      month,
      total: data.assessmentTrends.totalAssessments[i],
      highRisk: data.assessmentTrends.highRiskCases[i]
    }));
  }, [data]);

  const disease = useMemo(() => {
    if (!data) return [];
    return data.diseaseDistribution.labels.map((label, i) => ({
      label,
      value: data.diseaseDistribution.values[i]
    }));
  }, [data]);

  const riskLevels = useMemo(() => {
    if (!data) return [];
    return data.riskLevelDistribution.labels.map((label, i) => ({
      label,
      value: data.riskLevelDistribution.values[i]
    }));
  }, [data]);

  const age = useMemo(() => {
    if (!data) return [];
    return data.ageGroupRisk.labels.map((label, i) => ({
      label,
      value: data.ageGroupRisk.values[i]
    }));
  }, [data]);

  if (!data) return <div className="text-slate-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Topbar title="Analytics" />
        <select className="select w-52" value={range} onChange={(e) => setRange(e.target.value)}>
          <option>Last 6 Months</option>
          <option>Last 30 Days</option>
          <option>Last 12 Months</option>
        </select>
      </div>

      <div className="card p-6">
        <div className="text-lg font-semibold">Assessment Trends</div>
        <div className="text-sm text-slate-500">Monthly assessment volume and high-risk cases</div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Assessments" />
              <Line type="monotone" dataKey="highRisk" stroke="#ef4444" strokeWidth={2} dot={false} name="High Risk Cases" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="text-lg font-semibold">Disease Distribution</div>
          <div className="text-sm text-slate-500">Breakdown by disease type</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={disease} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {disease.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {disease.map((d, i) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{d.label}</span>
                  </div>
                  <div className="font-semibold">{d.value} cases</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="text-lg font-semibold">Risk Level Distribution</div>
          <div className="text-sm text-slate-500">Patient categorization by risk level</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskLevels} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {riskLevels.map((_, i) => (
                    <Cell key={i} fill={["#10b981", "#f59e0b", "#ef4444", "#991b1b"][i] ?? "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {riskLevels.map((r) => (
              <div key={r.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">{r.label}</div>
                <div className="text-xl font-semibold mt-1">{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-lg font-semibold">Age Group Risk Analysis</div>
        <div className="text-sm text-slate-500">Average risk score by age group</div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={age} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 80]} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-xs text-slate-500">Range: {range} (demo)</div>
    </div>
  );
}

