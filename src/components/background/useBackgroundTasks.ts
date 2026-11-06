import { useContext } from "react";
import { BackgroundTasksContext } from "./tasksContext";

export function useBackgroundTasks() {
  const context = useContext(BackgroundTasksContext);
  if (!context) throw new Error("useBackgroundTasks must be used within BackgroundTasksProvider");
  return context;
}
