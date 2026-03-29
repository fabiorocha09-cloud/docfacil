import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl transition-all backdrop-blur-md bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/20"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-gray-900" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-300" />
      )}
    </button>
  );
}