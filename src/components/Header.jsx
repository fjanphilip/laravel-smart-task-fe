import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

export default function Header() {
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const displayName = user.name || user.email?.split("@")[0] || "Alex Rivera";
  const displayRole = user.role || (user.email ? "Team Member" : "Product Designer");

  const handleNotificationClick = (notif) => {
    setIsDropdownOpen(false);
    if (notif.task_id) {
      const projectId = notif.task?.project_id;
      const taskId = notif.task_id;

      if (window.location.pathname !== "/tasks") {
        navigate("/tasks", { 
          state: { 
            highlightTaskId: taskId, 
            projectId: projectId 
          } 
        });
      } else {
        window.dispatchEvent(new CustomEvent("highlight-task", { 
          detail: { taskId, projectId } 
        }));
      }
    }
  };

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
        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 hover:bg-surface-container-high transition-colors relative flex items-center justify-center border-4 border-transparent hover:border-black active:translate-x-0.5 active:translate-y-0.5 text-black"
          >
            <span className="material-symbols-outlined text-3xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-secondary text-white border-2 border-black rounded-full flex items-center justify-center font-label-mono text-[10px] font-bold shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                {unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-4 w-96 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black z-50 flex flex-col max-h-[450px] overflow-hidden">
              {/* Dropdown Header */}
              <header className="p-4 border-b-4 border-black bg-primary-container flex justify-between items-center">
                <h4 className="font-display-lg text-sm font-black uppercase text-black">Notifications</h4>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      markAllAsRead();
                      setIsDropdownOpen(false);
                    }}
                    className="text-xs font-bold font-label-mono text-black hover:underline uppercase"
                  >
                    Mark all read
                  </button>
                )}
              </header>

              {/* Dropdown Content */}
              <div className="overflow-y-auto flex-grow divide-y-4 divide-black">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center font-label-mono text-xs text-gray-500">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id);
                        handleNotificationClick(notif);
                      }}
                      className={`p-4 text-left transition-colors cursor-pointer flex flex-col gap-1 ${
                        notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-tertiary-container/30 hover:bg-tertiary-container/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-display-lg text-xs font-black uppercase tracking-wider text-black">
                          {notif.title}
                        </span>
                        {!notif.is_read && (
                          <span className="w-2.5 h-2.5 bg-secondary border-2 border-black rounded-full shrink-0"></span>
                        )}
                      </div>
                      <p className="font-label-mono text-xs text-gray-800 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="font-label-mono text-[9px] text-gray-500 mt-1">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
