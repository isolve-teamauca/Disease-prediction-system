import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import { clearAuth, getAuth } from "../lib/auth.js";

export default function AppShell({ header, items, basePath }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  function logout() {
    clearAuth();
    navigate("/login");
  }

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  // optional guard for role/basePath
  if (basePath && !location.pathname.startsWith(basePath)) {
    return <Navigate to={basePath} replace />;
  }

  return (
    <div className="h-full flex flex-col">
      <TopNav header={header} user={auth.user} items={items} onLogout={logout} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

