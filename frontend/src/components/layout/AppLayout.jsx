import React, { useState } from "react";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import ToastContainer from "./Toast";

export default function AppLayout({ children, tabs, activeTab, onTabChange }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("uhis_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("uhis_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div
      className="uhis-shell"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-surface)",
      }}
    >
      <AppHeader
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "1.5rem 1.75rem",
            overflowY: "auto",
          }}
        >
          <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
