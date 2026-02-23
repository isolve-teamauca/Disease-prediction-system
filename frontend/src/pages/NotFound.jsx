import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-full grid place-items-center p-10">
      <div className="card p-8 max-w-lg w-full text-center">
        <div className="text-2xl font-semibold">Page not found</div>
        <div className="mt-2 text-slate-600">The page you’re looking for doesn’t exist.</div>
        <div className="mt-6">
          <Link to="/login" className="btn-primary w-full">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

