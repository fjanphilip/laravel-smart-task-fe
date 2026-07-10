// src/routes/index.jsx
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Task from "../pages/Task";
import Settings from "../pages/Settings";
import Register from "../pages/Register";

function ProtectedRoute({ children, allowedRoles }) {
  // Cek query parameters dari URL terlebih dahulu (misal hasil redirect Socialite)
  const queryParams = new URLSearchParams(window.location.search);
  const urlToken = queryParams.get("token");

  if (urlToken) {
    localStorage.setItem("access_token", urlToken);

    // Bersihkan query param ?token dari URL bar agar tidak mengganggu refresh/bookmark
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/tasks",
    element: (
      <ProtectedRoute>
        <Task />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
