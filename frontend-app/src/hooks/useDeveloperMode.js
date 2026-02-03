import { useState, useEffect } from "react";

const DEVELOPER_MODE_KEY = "sandy_developer_mode";

/**
 * Hook to manage developer mode state
 * Listens for Ctrl+B (or Cmd+B on Mac) to toggle
 * Persists state in localStorage
 */
export function useDeveloperMode() {
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(DEVELOPER_MODE_KEY);
    return stored === "true";
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl+B (Windows/Linux) or Cmd+B (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        setIsDeveloperMode((prev) => {
          const newValue = !prev;
          localStorage.setItem(DEVELOPER_MODE_KEY, String(newValue));
          console.log(`[Developer Mode] ${newValue ? "Enabled" : "Disabled"}`);
          return newValue;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return isDeveloperMode;
}
