"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isCollapsed,
        toggleCollapsed: () => setIsCollapsed((collapsed) => !collapsed),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within an AppLayout");
  }
  return context;
}
