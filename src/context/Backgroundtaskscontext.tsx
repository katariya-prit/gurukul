import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

export type TaskStatus = "running" | "success" | "error" | "cancelled";

export interface BackgroundTask {
  id: string;
  kind: string;
  title: string;
  status: TaskStatus;
  progress: number;
  error: string | null;
  meta: Record<string, unknown>;
  startedAt: number;
  finishedAt: number | null;
}

export interface TaskRunContext {
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

export interface StartTaskOptions {
  kind: string;
  title: string;
  meta?: Record<string, unknown>;
  run: (context: TaskRunContext) => Promise<void>;
}

interface BackgroundTasksValue {
  tasks: BackgroundTask[];
  runningCount: number;
  startTask: (options: StartTaskOptions) => string;
  cancelTask: (id: string) => void;
  dismissTask: (id: string) => void;
  clearFinished: () => void;
}

const BackgroundTasksContext = createContext<BackgroundTasksValue | null>(null);

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function BackgroundTasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());

  const patchTask = useCallback((id: string, patch: Partial<BackgroundTask>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }, []);

  const startTask = useCallback(
    (options: StartTaskOptions) => {
      const id = createId();
      const controller = new AbortController();
      controllersRef.current.set(id, controller);

      setTasks((prev) => [
        {
          id,
          kind: options.kind,
          title: options.title,
          status: "running",
          progress: 0,
          error: null,
          meta: options.meta ?? {},
          startedAt: Date.now(),
          finishedAt: null,
        },
        ...prev,
      ]);

      options
        .run({
          onProgress: (percent) =>
            patchTask(id, { progress: Math.max(0, Math.min(100, Math.round(percent))) }),
          signal: controller.signal,
        })
        .then(() => {
          patchTask(id, { status: "success", progress: 100, finishedAt: Date.now() });
          toast.success(`${options.title} completed`);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            patchTask(id, { status: "cancelled", finishedAt: Date.now() });
            toast.info(`${options.title} cancelled`);
            return;
          }

          const message = error instanceof Error ? error.message : "Task failed";
          patchTask(id, { status: "error", error: message, finishedAt: Date.now() });
          toast.error(`${options.title} failed: ${message}`);
        })
        .finally(() => {
          controllersRef.current.delete(id);
        });

      return id;
    },
    [patchTask]
  );

  const cancelTask = useCallback((id: string) => {
    controllersRef.current.get(id)?.abort();
  }, []);

  const dismissTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => !(task.id === id && task.status !== "running")));
  }, []);

  const clearFinished = useCallback(() => {
    setTasks((prev) => prev.filter((task) => task.status === "running"));
  }, []);

  const runningCount = useMemo(() => tasks.filter((task) => task.status === "running").length, [tasks]);

  useEffect(() => {
    if (runningCount === 0) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [runningCount]);

  const value = useMemo<BackgroundTasksValue>(
    () => ({ tasks, runningCount, startTask, cancelTask, dismissTask, clearFinished }),
    [tasks, runningCount, startTask, cancelTask, dismissTask, clearFinished]
  );

  return <BackgroundTasksContext.Provider value={value}>{children}</BackgroundTasksContext.Provider>;
}

export function useBackgroundTasks() {
  const context = useContext(BackgroundTasksContext);

  if (!context) {
    throw new Error("useBackgroundTasks must be used inside BackgroundTasksProvider");
  }

  return context;
}