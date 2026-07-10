import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);

  const [token, setToken] = useState(localStorage.getItem("access_token"));

  // Lakukan polling ringan terhadap token di localStorage setiap 1 detik
  // agar React Context tahu jika user melakukan login/logout di dalam SPA
  useEffect(() => {
    const checkToken = setInterval(() => {
      const currentToken = localStorage.getItem("access_token");
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);

    return () => clearInterval(checkToken);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const apiBase = api.defaults.baseURL || "https://smarttask-api.jfaith.tech/api";

    // Gunakan parser URL bawaan browser agar mendukung URL relatif & absolut secara sempurna
    let streamUrl;
    try {
      const url = apiBase.startsWith("http")
        ? new URL(apiBase)
        : new URL(apiBase, window.location.origin);

      if (url.port === "8000") {
        // Pada Windows local development, karena php artisan serve bersifat single-threaded
        // dan PHP_CLI_SERVER_WORKERS tidak didukung di Windows (karena tidak ada fork()),
        // kita pisahkan port untuk tiap role agar tidak saling mengunci saat diuji bersamaan:
        // - Developer: port 8001
        // - Manager: port 8002
        // - Admin/Lainnya: port 8003
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (user?.role === "developer") {
          url.port = "8001";
        } else if (user?.role === "manager") {
          url.port = "8002";
        } else {
          url.port = "8003";
        }
      }

      // Alihkan hostname agar cocok dengan browser window (localhost vs 127.0.0.1)
      // Ini sangat penting di Windows untuk menghindari delay/kegagalan resolusi DNS localhost (IPv6 vs IPv4)
      const currentHost = window.location.hostname;
      if (
        (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
        currentHost
      ) {
        url.hostname = currentHost;
      }

      // Gabungkan path /notifications/stream dan hapus kemungkinan double slashes
      const cleanPath = `${url.pathname}/notifications/stream`.replace(
        /\/+/g,
        "/",
      );
      streamUrl = `${url.origin}${cleanPath}?token=${token}`;
    } catch (e) {
      console.error("Gagal melakukan parsing API Base URL:", e);
      const fallbackHost = window.location.hostname || "127.0.0.1";
      streamUrl = `http://${fallbackHost}:8001/api/notifications/stream?token=${token}`;
    }

    // Buat EventSource dengan menyertakan token di URL
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      // Hiraukan data keepalive kosong
      if (event.data.trim() === ": keepalive" || !event.data) return;

      try {
        const newNotifications = JSON.parse(event.data);
        if (Array.isArray(newNotifications) && newNotifications.length > 0) {
          setNotifications((prev) => {
            // Saring agar tidak ada ID ganda yang masuk ke state
            const existingIds = new Set(prev.map((n) => n.id));
            const uniqueNew = newNotifications.filter(
              (n) => !existingIds.has(n.id),
            );
            return [...uniqueNew, ...prev];
          });

          setUnreadCount((prev) => prev + newNotifications.length);

          // Tampilkan Toast untuk notifikasi terbaru
          const latest = newNotifications[newNotifications.length - 1];
          setActiveToast(latest);

          // Hilangkan toast setelah 5 detik
          setTimeout(() => setActiveToast(null), 5000);
        }
      } catch (err) {
        console.error("Gagal mendecode data SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error(
        "SSE Connection Error (browser akan mencoba menyambung ulang otomatis):",
        err,
      );
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Gagal menandai notifikasi dibaca:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Gagal menandai semua notifikasi dibaca:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        setActiveToast,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}

      {/* Toast Neo-Brutalism Real-Time Alert */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-secondary border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-start">
            <h4 className="font-display-lg text-sm font-black uppercase tracking-wider text-white">
              🔔 {activeToast.title}
            </h4>
            <button
              onClick={() => setActiveToast(null)}
              className="text-white hover:text-black font-bold font-label-mono text-xs"
            >
              ✕
            </button>
          </div>
          <p className="font-label-mono text-xs text-white/90">
            {activeToast.message}
          </p>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
