"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export default function ThemeWrapper({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) setTheme(saved);
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}