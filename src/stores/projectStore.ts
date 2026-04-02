import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Client, Project, Issue } from "@/lib/types";
import { nanoid } from "nanoid";

interface ProjectState {
  clients: Client[];
  projects: Project[];
  issues: Issue[];

  addClient: (client: Omit<Client, "id" | "createdAt">) => string;
  updateClient: (id: string, partial: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addProject: (project: Omit<Project, "id" | "createdAt" | "completedAt">) => string;
  updateProject: (id: string, partial: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addIssue: (issue: Omit<Issue, "id" | "createdAt">) => string;
  updateIssue: (id: string, partial: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;

  getProjectsByClient: (clientId: string) => Project[];
  getActiveProjects: () => Project[];
  getOpenIssueCount: (projectId?: string) => number;
  getMRR: () => number;
  getClientById: (id: string) => Client | undefined;
  getProjectById: (id: string) => Project | undefined;
  getIssuesByProject: (projectId: string) => Issue[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      clients: [],
      projects: [],
      issues: [],

      addClient: (client) => {
        const id = nanoid();
        set((s) => ({
          clients: [...s.clients, { ...client, id, createdAt: Date.now() }],
        }));
        return id;
      },
      updateClient: (id, partial) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),
      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addProject: (project) => {
        const id = nanoid();
        set((s) => ({
          projects: [
            ...s.projects,
            { ...project, id, createdAt: Date.now(), completedAt: null },
          ],
        }));
        return id;
      },
      updateProject: (id, partial) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            const updated = { ...p, ...partial };
            if (partial.status === "completed" && !p.completedAt) {
              updated.completedAt = Date.now();
            }
            return updated;
          }),
        })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      addIssue: (issue) => {
        const id = nanoid();
        set((s) => ({
          issues: [...s.issues, { ...issue, id, createdAt: Date.now() }],
        }));
        return id;
      },
      updateIssue: (id, partial) =>
        set((s) => ({
          issues: s.issues.map((i) => (i.id === id ? { ...i, ...partial } : i)),
        })),
      deleteIssue: (id) =>
        set((s) => ({ issues: s.issues.filter((i) => i.id !== id) })),

      getProjectsByClient: (clientId) =>
        get().projects.filter((p) => p.clientId === clientId),
      getActiveProjects: () =>
        get().projects.filter((p) => p.status === "active"),
      getOpenIssueCount: (projectId?) => {
        const issues = projectId
          ? get().issues.filter((i) => i.projectId === projectId)
          : get().issues;
        return issues.filter((i) => i.status !== "done").length;
      },
      getMRR: () =>
        get()
          .projects.filter((p) => p.billingType === "retainer" && p.status === "active")
          .reduce((sum, p) => sum + p.amount, 0),
      getClientById: (id) => get().clients.find((c) => c.id === id),
      getProjectById: (id) => get().projects.find((p) => p.id === id),
      getIssuesByProject: (projectId) =>
        get().issues.filter((i) => i.projectId === projectId),
    }),
    {
      name: "questline-projects",
      version: 1,
    }
  )
);
