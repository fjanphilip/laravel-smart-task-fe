import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, close } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isMember = user?.role === "member";

  const navItems = [
    { name: "Dashboard", path: "/", icon: "dashboard" },
    { name: "Tasks", path: "/tasks", icon: "checklist" },
    { name: "Settings", path: "/settings", icon: "settings" },
  ];

  const NavLink = ({ item, collapsed }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.name}
        to={item.path}
        onClick={close}
        title={collapsed ? item.name : undefined}
        className={`flex items-center gap-4 p-3 transition-all ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-primary-container text-on-primary-container border-2 border-black translate-x-1 translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            : "text-on-surface-variant hover:bg-surface-variant hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        }`}
      >
        <span className="material-symbols-outlined shrink-0">{item.icon}</span>
        {!collapsed && (
          <span className={`font-body-lg text-body-lg ${isActive ? "font-bold" : ""}`}>
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Desktop icon-only rail (tablet md–lg) */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-screen w-16 border-r-4 border-black bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-col z-40">
        <div className="p-2 flex flex-col h-full items-center">
          {/* Logo icon */}
          <div className="mb-6 mt-4">
            <img src="/logo.png" alt="SmartTask" className="w-8 h-8 border-2 border-black" />
          </div>
          {/* Nav icons */}
          <nav className="flex flex-col gap-3 flex-grow w-full">
            {navItems.map((item) => (
              <NavLink key={item.name} item={item} collapsed={true} />
            ))}
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex justify-center p-3 text-on-surface-variant hover:bg-error-container hover:text-error transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Full sidebar — desktop (lg+) always visible, mobile as off-canvas drawer */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 border-r-4 border-black bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col z-40 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 md:hidden lg:flex`}
      >
        <div className="p-gutter flex flex-col h-full">
          {/* Mobile close button */}
          <button
            onClick={close}
            className="lg:hidden self-end mb-4 p-2 border-4 border-black bg-error-container hover:bg-error hover:text-white transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Brand Logo */}
          <div className="mb-10 text-left flex items-center gap-3">
            <img src="/logo.png" alt="SmartTask" className="w-10 h-10 border-2 border-black shrink-0" />
            <div>
              <h1 className="font-display-lg text-headline-md font-black text-on-surface tracking-tighter leading-none">
                SmartTask
              </h1>
              <p className="font-body-md text-on-surface-variant text-xs">
                Modern Task Management
              </p>
            </div>
          </div>

          {/* Navigation Link List */}
          <nav className="flex flex-col gap-4 flex-grow">
            {navItems.map((item) => (
              <NavLink key={item.name} item={item} collapsed={false} />
            ))}

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
    </>
  );
}
