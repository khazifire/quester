import { useProjectStore } from "@/stores/projectStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useHabitStore } from "@/stores/habitStore";
import { useScheduleStore } from "@/stores/scheduleStore";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

function makeISO(daysOffset: number, hour: number, min: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function getMonthDateStr(day: number, monthsBack: number = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(day);
  return d.toISOString().split("T")[0];
}

export function seedData() {
  const ps = useProjectStore.getState();
  const fs = useFinanceStore.getState();
  const hs = useHabitStore.getState();
  const ss = useScheduleStore.getState();

  if (ps.clients.length > 0) return;

  const nexoraId = ps.addClient({ name: "Nexora Labs", color: "#6a9ec4" });
  const verdantId = ps.addClient({ name: "Verdant Studio", color: "#7ab87a" });
  const heliosId = ps.addClient({ name: "Helios Corp", color: "#c4a86a" });
  const prismId = ps.addClient({ name: "Prism Digital", color: "#a38cc4" });
  const meridianId = ps.addClient({ name: "Meridian AI", color: "#c47a8a" });

  const p1 = ps.addProject({
    clientId: nexoraId,
    name: "Dashboard Redesign",
    billingType: "fixed",
    status: "active",
    amount: 4500,
    dueDate: getDateStr(13),
  });
  const p2 = ps.addProject({
    clientId: verdantId,
    name: "E-commerce Platform",
    billingType: "retainer",
    status: "active",
    amount: 3200,
    dueDate: "1st",
  });
  const p3 = ps.addProject({
    clientId: heliosId,
    name: "Brand Identity System",
    billingType: "fixed",
    status: "active",
    amount: 6800,
    dueDate: getDateStr(20),
  });
  const p4 = ps.addProject({
    clientId: nexoraId,
    name: "API Integration",
    billingType: "fixed",
    status: "completed",
    amount: 2800,
    dueDate: null,
  });
  const p5 = ps.addProject({
    clientId: prismId,
    name: "Landing Page",
    billingType: "fixed",
    status: "completed",
    amount: 1500,
    dueDate: null,
  });
  const p6 = ps.addProject({
    clientId: meridianId,
    name: "ML Dashboard",
    billingType: "retainer",
    status: "active",
    amount: 4000,
    dueDate: "15th",
  });

  ps.addIssue({
    projectId: p1,
    title: "Nav breaks on mobile",
    description: "Navigation menu does not collapse properly on mobile viewports",
    priority: "high",
    status: "todo",
    deadline: getDateStr(3),
    reportedBy: "client",
  });
  ps.addIssue({
    projectId: p1,
    title: "Dark mode contrast",
    description: "Text contrast ratio fails WCAG AA on dark mode",
    priority: "medium",
    status: "in-progress",
    deadline: null,
    reportedBy: "self",
  });
  ps.addIssue({
    projectId: p2,
    title: "Cart total calculation",
    description: "Cart total doesn't include tax for certain states",
    priority: "high",
    status: "todo",
    deadline: getDateStr(6),
    reportedBy: "client",
  });
  ps.addIssue({
    projectId: p2,
    title: "Lazy loading images",
    description: "Product images should use lazy loading for performance",
    priority: "low",
    status: "done",
    deadline: null,
    reportedBy: "self",
  });
  ps.addIssue({
    projectId: p2,
    title: "Checkout flow UX",
    description: "Simplify the checkout to reduce cart abandonment",
    priority: "medium",
    status: "in-progress",
    deadline: getDateStr(10),
    reportedBy: "client",
  });
  ps.addIssue({
    projectId: p3,
    title: "Logo SVG export",
    description: "Export logo variants as optimized SVG",
    priority: "medium",
    status: "in-progress",
    deadline: getDateStr(8),
    reportedBy: "self",
  });
  ps.addIssue({
    projectId: p3,
    title: "Color palette revision",
    description: "Client requested warmer tones in secondary palette",
    priority: "low",
    status: "todo",
    deadline: null,
    reportedBy: "client",
  });
  ps.addIssue({
    projectId: p6,
    title: "Model metrics refresh",
    description: "Dashboard metrics should auto-refresh every 30s",
    priority: "low",
    status: "todo",
    deadline: getDateStr(16),
    reportedBy: "self",
  });

  fs.addInvoice({
    projectIds: [p4],
    amount: 2800,
    estimatedFees: 0,
    status: "paid",
    issuedDate: getDateStr(-30),
    dueDate: getDateStr(-15),
    paidDate: getDateStr(-12),
    items: [{ description: "API Integration - Full project", amount: 2800 }],
  });
  fs.addInvoice({
    projectIds: [p5],
    amount: 1500,
    estimatedFees: 0,
    status: "paid",
    issuedDate: getDateStr(-20),
    dueDate: getDateStr(-5),
    paidDate: getDateStr(-3),
    items: [{ description: "Landing Page - Full project", amount: 1500 }],
  });
  fs.addInvoice({
    projectIds: [p2],
    amount: 3200,
    estimatedFees: 0,
    status: "paid",
    issuedDate: getMonthDateStr(1, 1),
    dueDate: getMonthDateStr(7, 1),
    paidDate: getMonthDateStr(5, 1),
    items: [{ description: "E-commerce Platform - Monthly retainer (last month)", amount: 3200 }],
  });
  fs.addInvoice({
    projectIds: [p6],
    amount: 4000,
    estimatedFees: 0,
    status: "paid",
    issuedDate: getMonthDateStr(15, 1),
    dueDate: getMonthDateStr(22, 1),
    paidDate: getMonthDateStr(20, 1),
    items: [{ description: "ML Dashboard - Monthly retainer (last month)", amount: 4000 }],
  });
  fs.addInvoice({
    projectIds: [p2],
    amount: 3200,
    estimatedFees: 0,
    status: "sent",
    issuedDate: getMonthDateStr(1),
    dueDate: getMonthDateStr(7),
    paidDate: null,
    items: [{ description: "E-commerce Platform - Monthly retainer", amount: 3200 }],
  });

  const dailyExpenses = [
    { day: 1, items: [{ n: "Whole Foods", a: 87.4, c: "cat-food" }, { n: "Uber", a: 24.5, c: "cat-transport" }, { n: "Netflix", a: 15.99, c: "cat-subscriptions" }] },
    { day: 2, items: [{ n: "Coffee", a: 6.8, c: "cat-food" }, { n: "AWS", a: 42, c: "cat-business" }, { n: "Gym", a: 55, c: "cat-health" }] },
    { day: 3, items: [{ n: "Lunch", a: 18.2, c: "cat-food" }, { n: "Bus", a: 16, c: "cat-transport" }] },
    { day: 5, items: [{ n: "Dinner out", a: 72.5, c: "cat-food" }] },
    { day: 6, items: [{ n: "Gas", a: 48, c: "cat-transport" }] },
    { day: 7, items: [{ n: "Figma", a: 15, c: "cat-subscriptions" }] },
    { day: 8, items: [{ n: "Electric", a: 128, c: "cat-bills" }] },
    { day: 9, items: [{ n: "Coffee", a: 7.4, c: "cat-food" }, { n: "Spotify", a: 11, c: "cat-subscriptions" }, { n: "Snacks", a: 4, c: "cat-food" }] },
    { day: 10, items: [{ n: "Grocery", a: 64.2, c: "cat-food" }] },
    { day: 12, items: [{ n: "Books", a: 38.5, c: "cat-personal" }] },
  ];

  dailyExpenses.forEach((day) => {
    day.items.forEach((item) => {
      fs.addExpense({
        amount: item.a,
        name: item.n,
        categoryId: item.c,
        date: getMonthDateStr(day.day),
        subscriptionId: null,
      });
    });
  });

  const pastMonths = [
    { monthsBack: 5, total: 3100, items: [{ n: "Monthly expenses", a: 3100, c: "cat-food" }] },
    { monthsBack: 4, total: 3800, items: [{ n: "Monthly expenses", a: 3800, c: "cat-food" }] },
    { monthsBack: 3, total: 2900, items: [{ n: "Monthly expenses", a: 2900, c: "cat-food" }] },
    { monthsBack: 2, total: 3200, items: [{ n: "Monthly expenses", a: 3200, c: "cat-food" }] },
    { monthsBack: 1, total: 3400, items: [{ n: "Monthly expenses", a: 3400, c: "cat-food" }] },
  ];
  pastMonths.forEach((pm) => {
    fs.addExpense({
      amount: pm.total,
      name: "Monthly expenses (summarized)",
      categoryId: "cat-food",
      date: getMonthDateStr(15, pm.monthsBack),
      subscriptionId: null,
    });
  });

  const pastIncomeData = [
    { monthsBack: 5, amount: 8400 },
    { monthsBack: 4, amount: 9200 },
    { monthsBack: 3, amount: 7800 },
    { monthsBack: 2, amount: 11200 },
    { monthsBack: 1, amount: 10600 },
  ];
  pastIncomeData.forEach((pi) => {
    fs.addInvoice({
      projectIds: [p2],
      amount: pi.amount,
      estimatedFees: 0,
      status: "paid",
      issuedDate: getMonthDateStr(1, pi.monthsBack),
      dueDate: getMonthDateStr(7, pi.monthsBack),
      paidDate: getMonthDateStr(5, pi.monthsBack),
      items: [{ description: `Income - ${pi.monthsBack} months ago`, amount: pi.amount }],
    });
  });

  fs.addSubscription({ name: "Netflix", amount: 15.99, categoryId: "cat-entertainment", cycle: "monthly", nextDate: getDateStr(29), active: true });
  fs.addSubscription({ name: "Spotify", amount: 10.99, categoryId: "cat-entertainment", cycle: "monthly", nextDate: getDateStr(37), active: true });
  fs.addSubscription({ name: "Figma Pro", amount: 15, categoryId: "cat-business", cycle: "monthly", nextDate: getDateStr(35), active: true });
  fs.addSubscription({ name: "AWS Hosting", amount: 42, categoryId: "cat-business", cycle: "monthly", nextDate: getDateStr(30), active: true });
  fs.addSubscription({ name: "Gym", amount: 55, categoryId: "cat-health", cycle: "monthly", nextDate: getDateStr(30), active: true });
  fs.addSubscription({ name: "iCloud", amount: 2.99, categoryId: "cat-subscriptions", cycle: "monthly", nextDate: getDateStr(43), active: true });

  fs.addSavingGoal({ name: "MacBook Pro M4", targetAmount: 3200, savedAmount: 2100, monthlyContribution: 350, isEmergency: false });
  fs.addSavingGoal({ name: "Emergency fund", targetAmount: 10000, savedAmount: 6800, monthlyContribution: 400, isEmergency: true });
  fs.addSavingGoal({ name: "Japan trip", targetAmount: 5000, savedAmount: 1200, monthlyContribution: 250, isEmergency: false });

  const h1 = hs.addHabit({ name: "Morning review", icon: "◐", category: "system", active: true });
  const h2 = hs.addHabit({ name: "Track expenses", icon: "◈", category: "finance", active: true });
  const h3 = hs.addHabit({ name: "30 min exercise", icon: "△", category: "health", active: true });
  const h4 = hs.addHabit({ name: "Read 20 pages", icon: "▢", category: "growth", active: true });
  const h5 = hs.addHabit({ name: "Weekly planning", icon: "◇", category: "system", active: true });
  const h6 = hs.addHabit({ name: "Client follow-up", icon: "◎", category: "work", active: true });

  const habitStreaks: [string, number][] = [
    [h1, 12], [h2, 8], [h3, 5], [h4, 3], [h5, 6], [h6, 4],
  ];
  habitStreaks.forEach(([habitId, streakDays]) => {
    for (let i = 0; i < streakDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      hs.toggleToday(habitId);
      const store = useHabitStore.getState();
      const lastLog = store.logs[store.logs.length - 1];
      if (lastLog && lastLog.habitId === habitId) {
        useHabitStore.setState((s) => ({
          logs: s.logs.map((l) =>
            l.id === lastLog.id ? { ...l, date: dateStr } : l
          ),
        }));
      }
    }
  });

  ss.addEvent({ title: "Nexora \u2014 Sprint Review", startTime: makeISO(0, 9, 0), duration: 45, type: "meeting", clientId: nexoraId, projectId: p1, googleEventId: null });
  ss.addEvent({ title: "Deep work: E-commerce", startTime: makeISO(0, 10, 0), duration: 120, type: "focus", clientId: verdantId, projectId: p2, googleEventId: null });
  ss.addEvent({ title: "Helios \u2014 Brand Check-in", startTime: makeISO(0, 13, 0), duration: 30, type: "meeting", clientId: heliosId, projectId: p3, googleEventId: null });
  ss.addEvent({ title: "Code review block", startTime: makeISO(0, 14, 30), duration: 60, type: "focus", clientId: null, projectId: null, googleEventId: null });
  ss.addEvent({ title: "Verdant \u2014 Weekly Sync", startTime: makeISO(0, 16, 0), duration: 30, type: "meeting", clientId: verdantId, projectId: p2, googleEventId: null });
  ss.addEvent({ title: "Prism \u2014 Kickoff", startTime: makeISO(1, 9, 30), duration: 60, type: "meeting", clientId: prismId, projectId: null, googleEventId: null });
  ss.addEvent({ title: "Design system work", startTime: makeISO(1, 11, 0), duration: 90, type: "focus", clientId: null, projectId: null, googleEventId: null });
  ss.addEvent({ title: "Lunch with Alex", startTime: makeISO(1, 12, 30), duration: 60, type: "personal", clientId: null, projectId: null, googleEventId: null });
  ss.addEvent({ title: "Meridian \u2014 Review", startTime: makeISO(1, 14, 0), duration: 45, type: "meeting", clientId: meridianId, projectId: p6, googleEventId: null });

  ss.addEvent({ title: "Nexora \u2014 Design Review", startTime: makeISO(2, 10, 0), duration: 60, type: "meeting", clientId: nexoraId, projectId: p1, googleEventId: null });
  ss.addEvent({ title: "Focus: Brand System", startTime: makeISO(2, 14, 0), duration: 120, type: "focus", clientId: heliosId, projectId: p3, googleEventId: null });
  ss.addEvent({ title: "Verdant \u2014 Demo", startTime: makeISO(3, 9, 0), duration: 45, type: "meeting", clientId: verdantId, projectId: p2, googleEventId: null });
  ss.addEvent({ title: "Personal admin", startTime: makeISO(4, 10, 0), duration: 60, type: "personal", clientId: null, projectId: null, googleEventId: null });
}
