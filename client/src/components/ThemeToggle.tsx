import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  if (!toggleTheme) return null;
  const dark = theme === "dark";
  return <button type="button" onClick={toggleTheme} className="grid size-9 place-items-center rounded-full border border-[#dfe6da] bg-white/80 text-[#526159] shadow-sm transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-[#d6f37b]" aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"} title={dark ? "Mode terang" : "Mode gelap"}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>;
}
