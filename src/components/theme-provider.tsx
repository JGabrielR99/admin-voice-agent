"use client";

import * as React from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [theme] = React.useState(defaultTheme);

  // Apply theme immediately when component mounts
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <div className={theme}>{children}</div>;
}
