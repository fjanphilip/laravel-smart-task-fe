import React, { useState } from "react";

export default function Header() {
  const [search, setSearch] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const displayName = user.name || user.email?.split("@")[0] || "Alex Rivera";
  const displayRole = user.role || (user.email ? "Team Member" : "Product Designer");

  return (
    <header className="sticky top-0 w-full flex justify-between items-center px-gutter z-30 bg-surface h-20 border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Search Section */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-container-low border-4 border-black px-4 py-2 w-64 font-label-mono focus:bg-primary-container focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all text-black"
            placeholder="Search projects..."
          />
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
        </div>
      </div>

      {/* Profile & Notifications Section */}
      <div className="flex items-center gap-6">
        <button className="p-2 hover:bg-surface-container-high transition-colors relative">
          <span className="material-symbols-outlined text-3xl">notifications</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary border-2 border-black rounded-full"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-headline-sm text-sm font-bold text-on-background capitalize">
              {displayName}
            </p>
            <p className="font-label-mono text-xs text-on-surface-variant">
              {displayRole}
            </p>
          </div>
          <img
            className="w-12 h-12 border-4 border-black bg-primary-container object-cover"
            alt="Profile Avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwkfnrtFgBdddw3iHYNsh7cKSPhTKPZtZBx8U8dkpcZzZNzAbD8taSaRDuyHKApMjyX5cUc__LkIfMo7o0qhI5KsZu2hJ9l-4eNMy7rwl1xj9aDERglBpsH4jW9vl1OEvysHXoc04OIHIzmHsNYhmATrvaUZYft_vnt-kiinWRlvOLgj4SIKy_s42Jez4Nyh3dRcbbhfSLj8PivXU0A-9_bl5WmL46Odj9n6QN9FinBRgGN1JN2xsxJSIzYZxwes8bu9ppHp16FUL5"
          />
        </div>
      </div>
    </header>
  );
}
