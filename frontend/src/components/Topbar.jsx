import React from "react";

export default function Topbar({ title, right = null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xl font-semibold">{title}</div>
      </div>
      {right}
    </div>
  );
}

