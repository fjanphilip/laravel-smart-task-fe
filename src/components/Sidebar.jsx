import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Task from "../pages/Task";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isAdmin = user?.role === "admin";
  const isMember = user?.role === "member";

  const navItems = [
    { name: "Dashboard", path: "/", icon: "dashboard" },
    { name: "Tasks", path: "/tasks", icon: "checklist" },
    // { name: "Projects", path: "/projects", icon: "folder" },
    { name: "Settings", path: "/settings", icon: "settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r-4 border-black bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col z-40">
      <div className="p-gutter flex flex-col h-full">
        {/* Brand Logo */}
        <div className="mb-10 text-left">
          <h1 className="font-display-lg text-headline-md font-black text-on-surface tracking-tighter">
            SmartTask
          </h1>
          <p className="font-body-md text-on-surface-variant text-sm">
            Modern Task Management
          </p>
        </div>

        {/* Navigation Link List */}
        <nav className="flex flex-col gap-4 flex-grow">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 p-3 transition-all ${
                  isActive
                    ? "bg-primary-container text-on-primary-container border-2 border-black translate-x-1 translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "text-on-surface-variant hover:bg-surface-variant hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span
                  className={`font-body-lg text-body-lg ${isActive ? "font-bold" : ""}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 p-3 text-left text-on-surface-variant hover:bg-error-container hover:text-error transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-body-lg text-body-lg">Logout</span>
          </button>
        </nav>

        {/* Action Button */}
        {!isMember && (
          <button className="mt-auto bg-primary-container border-4 border-black font-bold p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] neo-press transition-all hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            New Task
          </button>
        )}
      </div>
    </aside>
  );
}
