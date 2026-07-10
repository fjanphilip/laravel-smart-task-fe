import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import echo from "../services/echo";

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

  // Muat daftar notifikasi awal (belum dibaca) melalui API REST
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchInitialNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        const list = response.data.data || [];
        setNotifications(list);
        setUnreadCount(list.length);
      } catch (err) {
        console.error("Gagal memuat notifikasi awal:", err);
      }
    };

    fetchInitialNotifications();
  }, [token]);

  // Berlangganan ke channel privat user via Laravel Reverb (Echo) untuk update realtime
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token || !user?.id) return;

    console.log(`[Reverb] Berlangganan ke Private Channel: App.Models.User.${user.id}`);
    
    const channel = echo.private(`App.Models.User.${user.id}`)
      .listen(".NotificationSent", (e) => {
        console.log("[Reverb] Menerima Notifikasi Baru:", e.notification);
        const newNotif = e.notification;

        setNotifications((prev) => {
          // Saring agar tidak ada ID ganda
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);

        // Tampilkan Toast untuk notifikasi terbaru
        setActiveToast(newNotif);

        // Hilangkan toast setelah 5 detik
        setTimeout(() => setActiveToast(null), 5000);
      });

    return () => {
      console.log(`[Reverb] Keluar dari Private Channel: App.Models.User.${user.id}`);
      echo.leaveChannel(`App.Models.User.${user.id}`);
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
