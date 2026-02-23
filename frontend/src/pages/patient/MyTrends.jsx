import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import { apiGet } from "../../lib/api.js";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function MyTrends() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    apiGet("/api/patient/trends")
      .then((payload) => {
        if (!alive) return;
        setData(payload);
      })
      .catch(() => {
        if (!alive) return;
        setError("Unable to load trends right now.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const hrSeries = useMemo(() => {
    if (!data?.heartRate?.labels?.length) return [];
    return data.heartRate.labels.map((l, i) => ({
      label: l,
      average: data.heartRate.average?.[i],
      resting: data.heartRate.resting?.[i]
    }));
  }, [data]);

  const bpSeries = useMemo(() => {
    if (!data?.bloodPressure?.labels?.length) return [];
    return data.bloodPressure.labels.map((l, i) => ({
      label: l,
      systolic: data.bloodPressure.systolic?.[i],
      diastolic: data.bloodPressure.diastolic?.[i]
    }));
  }, [data]);

  const weightSeries = useMemo(() => {
    if (!data?.weight?.labels?.length) return [];
    return data.weight.labels.map((l, i) => ({ label: l, weight: data.weight.values?.[i] }));
  }, [data]);

  const sleepSeries = useMemo(() => {
    if (!data?.sleep?.labels?.length) return [];
    return data.sleep.labels.map((l, i) => {
      const total = data.sleep.values?.[i];
      const deep = typeof total === "number" ? Math.max(0, Math.round(total * 0.35 * 10) / 10) : undefined;
      return { label: l, total, deep };
    });
  }, [data]);

  function Card({ title, subtitle, children }) {
    return (
      <section className="card flex h-full flex-col p-6">
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        {children}
      </section>
    );
  }

  function EmptyChart({ label }) {
    return (
      <div className="mt-4 flex min-h-56 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-400">
        {label}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Topbar title="My Trends" />

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Heart Rate Trends" subtitle="Average and resting heart rate over time">
          {data ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hrSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="average" stroke="#ef4444" strokeWidth={2} dot={false} name="Average" />
                  <Line type="monotone" dataKey="resting" stroke="#3b82f6" strokeWidth={2} dot={false} name="Resting" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="Line chart placeholder" />
          )}
        </Card>

        <Card title="Blood Pressure Trends" subtitle="Systolic and diastolic pressure measurements">
          {data ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bpSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="systolic" stroke="#f59e0b" strokeWidth={2} dot={false} name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="Dual-line placeholder" />
          )}
        </Card>

        <Card title="Weight Progress" subtitle="6-month weight tracking">
          {data ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={false} name="Weight" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="Trend placeholder" />
          )}
        </Card>

        <Card title="Sleep Patterns" subtitle="Total and deep sleep hours">
          {data ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Total" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="deep" name="Deep" fill="#a5b4fc" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="Bar chart placeholder" />
          )}
        </Card>
      </div>
    </div>
  );
}

