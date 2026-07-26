"use client";

import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toast.Provider placement="bottom end"  />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
