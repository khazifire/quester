import { useAppStore } from "@/stores/appStore";

export function LandingPage() {
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
      <div className="max-w-[480px] text-center px-6">
        <div className="mb-8">
          <span className="text-[14px] font-medium tracking-tight text-foreground/80">
            QUESTLINE <span className="text-muted-foreground">1.0</span>
          </span>
        </div>

        <h1 className="text-[28px] font-medium tracking-tight mb-4">
          Your personal command center
        </h1>

        <p className="text-[14px] text-muted-foreground leading-relaxed mb-3">
          Track projects, manage finances, build habits, and log your runs
          &mdash; all in one place. Designed for freelancers and independent
          workers who want to stay intentional about their work and life.
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[12px] text-muted-foreground/60 mb-8">
          <span>Projects & Issues</span>
          <span>Invoices & Expenses</span>
          <span>Habits & Systems</span>
          <span>Running & Events</span>
          <span>Savings Goals</span>
        </div>

        <button
          onClick={setOnboarded}
          className="inline-flex items-center justify-center h-10 px-8 text-[13px] font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity cursor-pointer"
        >
          Get started
        </button>

        <p className="text-[11px] text-muted-foreground/40 mt-6">
          All data is stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
