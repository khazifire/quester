import { NavBar } from "./NavBar";
import { useAppStore } from "@/stores/appStore";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppShell({ children, title, subtitle, actions }: AppShellProps) {
  const { showAmounts, toggleAmounts } = useAppStore();
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <header className="border-b border-border">
          <div className="flex justify-between items-center px-6 py-3 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-6">
              <span className="text-[14px] font-medium tracking-tight text-foreground/80">
                QUESTLINE <span className="text-muted-foreground">1.0</span>
              </span>
              <NavBar />
            </div>

            <div className="flex items-center gap-5">
              <button
                onClick={toggleAmounts}
                className="text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-opacity"
              >
                {showAmounts ? "[visible]" : "[hidden]"}
              </button>
              <span className="text-[13px] text-muted-foreground font-mono tabular-nums">
                {time}
              </span>
            </div>
          </div>
        </header>

        <main className="px-6 pb-12 pt-6 max-w-[1400px] mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              {subtitle && (
                <div className="text-[12px] text-muted-foreground mb-0.5">
                  {subtitle}
                </div>
              )}
              <h1 className="text-[17px] font-medium tracking-tight">
                {title}
              </h1>
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
          {children}
        </main>

        <Toaster
          toastOptions={{
            style: {
              background: "#161616",
              color: "#e0e0e0",
              border: "1px solid #222",
              borderRadius: "6px",
              fontSize: "13px",
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}
