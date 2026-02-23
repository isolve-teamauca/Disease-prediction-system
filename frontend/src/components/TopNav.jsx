import React from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition whitespace-nowrap",
          isActive
            ? "bg-brand-50 text-brand-700 border border-brand-100"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        )
      }
    >
      {Icon ? <Icon size={16} className="text-brand-600" /> : null}
      <span>{label}</span>
    </NavLink>
  );
}

export default function TopNav({ header, user, items, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="w-full pl-0 pr-6 py-4 grid grid-cols-[auto,1fr,auto] items-center gap-4">
        <div className="shrink-0 justify-self-start ml-0 pl-0">{header}</div>

        <nav className="overflow-auto justify-self-center">
          <div className="flex items-center gap-2 md:justify-center">
            {items.map((it) => (
              <NavItem key={it.to} to={it.to} icon={it.icon} label={it.label} />
            ))}
          </div>
        </nav>

        {user ? (
          <div className="shrink-0 flex items-center gap-3 justify-self-end">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 max-w-[280px]">
              <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold">
                {(user.name ?? "U")
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase())
                  .join("")}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold leading-tight">{user.name}</div>
                <div className="hidden sm:block text-xs text-slate-500 capitalize -mt-0.5">{user.role}</div>
                <button
                  type="button"
                  className="mt-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline text-left"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

