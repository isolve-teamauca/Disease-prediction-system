import React from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
          isActive ? "bg-brand-50 text-brand-700 border border-brand-100" : "text-slate-700 hover:bg-slate-50"
        )
      }
    >
      <span className="h-9 w-9 rounded-xl grid place-items-center bg-white border border-slate-200">
        <Icon size={18} className="text-brand-600" />
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ header, user, items, onLogout }) {
  return (
    <aside className="w-[280px] shrink-0 border-r border-slate-100 bg-white">
      <div className="p-5">
        {header}
        {user ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold">
              {(user.name ?? "U")
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase())
                .join("")}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">{user.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user.role}</div>
            </div>
          </div>
        ) : null}
      </div>

      <nav className="px-4 pb-4 space-y-1">
        {items.map((it) => (
          <Item key={it.to} to={it.to} icon={it.icon} label={it.label} />
        ))}
      </nav>

      <div className="mt-auto p-4">
        <button className="btn-ghost w-full" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

