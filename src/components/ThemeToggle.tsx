import { Moon, Sun } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = mounted && theme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className={cn(
            "group relative inline-flex h-8 w-[58px] shrink-0 items-center rounded-full border border-hairline bg-surface-muted px-1 shadow-soft transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.97]",
            className,
          )}
          style={{ willChange: "transform" }}
        >
          {/* track icons */}
          <Sun
            className={cn(
              "pointer-events-none absolute left-[9px] size-3.5 transition-opacity duration-150",
              isDark ? "opacity-35 text-muted-foreground" : "opacity-0",
            )}
          />
          <Moon
            className={cn(
              "pointer-events-none absolute right-[9px] size-3.5 transition-opacity duration-150",
              isDark ? "opacity-0" : "opacity-35 text-muted-foreground",
            )}
          />

          {/* thumb */}
          <span
            className="relative grid size-6 place-items-center rounded-full bg-brand-gradient text-brand-foreground shadow-glow transition-transform duration-300 [transition-timing-function:var(--ease-premium)]"
            style={{ transform: isDark ? "translateX(26px)" : "translateX(0px)" }}
          >
            <Sun
              className={cn(
                "absolute size-3.5 transition-all duration-300 [transition-timing-function:var(--ease-premium)]",
                isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
              )}
            />
            <Moon
              className={cn(
                "absolute size-3.5 transition-all duration-300 [transition-timing-function:var(--ease-premium)]",
                isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0",
              )}
            />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
    </Tooltip>
  );
}
