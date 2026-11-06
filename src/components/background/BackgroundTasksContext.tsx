import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  BackgroundTasksContext,
  type BackgroundTask,
  type StartBackgroundTaskInput,
} from "./tasksContext";

function createTaskId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BackgroundTasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());

  const startTask = useCallback((input: StartBackgroundTaskInput) => {
    const id = createTaskId();
    const controller = new AbortController();
    controllersRef.current.set(id, controller);
    setTasks((current) => [
      {
        id,
        kind: input.kind,
        title: input.title,
        meta: input.meta,
        status: "running",
        progress: 0,
      },
      ...current,
    ]);

    void Promise.resolve()
      .then(() =>
        input.run({
        signal: controller.signal,
        onProgress: (percent) => {
          const progress = Math.max(0, Math.min(100, percent));
          setTasks((current) =>
            current.map((task) => (task.id === id ? { ...task, progress } : task))
          );
        },
        })
      )
      .then(() => {
        setTasks((current) =>
          current.map((task) =>
            task.id === id && task.status === "running"
              ? { ...task, status: "success", progress: 100 }
              : task
          )
        );
      })
      .catch((error: unknown) => {
        const wasCancelled = controller.signal.aborted;
        setTasks((current) =>
          current.map((task) =>
            task.id === id && task.status === "running"
              ? {
                  ...task,
                  status: wasCancelled ? "cancelled" : "error",
                  error: error instanceof Error ? error.message : "Task failed",
                }
              : task
          )
        );
        if (!wasCancelled) {
          toast.error(error instanceof Error ? error.message : "Background task failed");
        }
      })
      .finally(() => controllersRef.current.delete(id));

    return id;
  }, []);

  const cancelTask = useCallback((id: string) => {
    if (!controllersRef.current.has(id)) return;
    controllersRef.current.get(id)?.abort();
    setTasks((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item))
    );
  }, []);

  const dismissTask = useCallback((id: string) => {
    if (controllersRef.current.has(id)) return;
    setTasks((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setTasks((current) => current.filter((task) => task.status === "running"));
  }, []);

  const runningCount = tasks.filter((task) => task.status === "running").length;

  useEffect(() => {
    if (runningCount === 0) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [runningCount]);

  useEffect(
    () => () => {
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current.clear();
    },
    []
  );

  const value = useMemo(
    () => ({ tasks, runningCount, startTask, cancelTask, dismissTask, clearFinished }),
    [tasks, runningCount, startTask, cancelTask, dismissTask, clearFinished]
  );

  return (
    <BackgroundTasksContext.Provider value={value}>{children}</BackgroundTasksContext.Provider>
  );
}
