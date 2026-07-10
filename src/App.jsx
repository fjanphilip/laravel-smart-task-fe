// src/App.jsx
import AppRoutes from "./routes";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  return (
    <NotificationProvider>
      <AppRoutes />
    </NotificationProvider>
  );
}

export default App;
