import React from "react";
import AppHeader from "./AppHeader";
import ToastContainer from "./Toast";

interface Tab {
  id: string;
  label: string;
  path?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

export default function AppLayout({ children, tabs, activeTab, onTabChange }: AppLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-surface)" }}>
      <AppHeader tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      <main style={{ flex: 1, padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
