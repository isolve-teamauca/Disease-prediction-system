import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LayoutDashboard, HeartPulse, LineChart, MessageSquare, BarChart3, Users, ClipboardList } from "lucide-react";

import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import NotFound from "./pages/NotFound.jsx";

import AppShell from "./layouts/AppShell.jsx";
import Logo from "./components/Logo.jsx";

import PatientDashboard from "./pages/patient/Dashboard.jsx";
import HealthTracking from "./pages/patient/HealthTracking.jsx";
import MyTrends from "./pages/patient/MyTrends.jsx";
import Assistant from "./pages/patient/Assistant.jsx";

import ProviderOverview from "./pages/provider/Overview.jsx";
import Patients from "./pages/provider/Patients.jsx";
import RiskAssessment from "./pages/provider/RiskAssessment.jsx";
import Analytics from "./pages/provider/Analytics.jsx";

function PatientLayout() {
  const items = [
    { to: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patient/health", label: "Health Tracking", icon: HeartPulse },
    { to: "/patient/trends", label: "My Trends", icon: LineChart },
    { to: "/patient/assistant", label: "AI Health Assistant", icon: MessageSquare }
  ];

  return (
    <AppShell
      basePath="/patient"
      header={<Logo subtitle="Patient Portal" />}
      items={items}
    />
  );
}

function ProviderLayout() {
  const items = [
    { to: "/provider/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/provider/patients", label: "Patients", icon: Users },
    { to: "/provider/risk-assessment", label: "Risk Assessment", icon: ClipboardList },
    { to: "/provider/analytics", label: "Analytics", icon: BarChart3 }
  ];

  return <AppShell basePath="/provider" header={<Logo subtitle="Healthcare Dashboard" />} items={items} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="health" element={<HealthTracking />} />
        <Route path="trends" element={<MyTrends />} />
        <Route path="assistant" element={<Assistant />} />
      </Route>

      <Route path="/provider" element={<ProviderLayout />}>
        <Route index element={<Navigate to="/provider/overview" replace />} />
        <Route path="overview" element={<ProviderOverview />} />
        <Route path="patients" element={<Patients />} />
        <Route path="risk-assessment" element={<RiskAssessment />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

