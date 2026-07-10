// src/App.jsx
import AppRoutes from "./routes";
import { NotificationProvider } from "./context/NotificationContext";
import { SidebarProvider } from "./context/SidebarContext";

function App() {
  return (
    <NotificationProvider>
      <SidebarProvider>
        <AppRoutes />
      </SidebarProvider>
    </NotificationProvider>
  );
}

export default App;
