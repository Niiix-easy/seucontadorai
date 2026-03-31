import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import PageTransition from "./PageTransition";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
