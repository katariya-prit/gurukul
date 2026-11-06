import { createContext } from "react";

export type BackgroundTaskStatus = "running" | "success" | "error" | "cancelled";

export interface BackgroundTask {
  id: string;
  kind: string;
  title: string;
  meta: Record<string, unknown>;
  status: BackgroundTaskStatus;
  progress: number;
  error?: string;
}

export interface BackgroundTaskRunContext {
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

export interface StartBackgroundTaskInput {
  kind: string;
  title: string;
  meta: Record<string, unknown>;
  run: (context: BackgroundTaskRunContext) => Promise<unknown>;
}

export interface BackgroundTasksContextValue {
  tasks: BackgroundTask[];
  runningCount: number;
  startTask: (input: StartBackgroundTaskInput) => string;
  cancelTask: (id: string) => void;
  dismissTask: (id: string) => void;
  clearFinished: () => void;
}

export const BackgroundTasksContext = createContext<BackgroundTasksContextValue | undefined>(
  undefined
);
