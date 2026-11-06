import { useCallback, useContext } from "react";
import { OverlayContext } from "./overlayContext";

export function useConfirm() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("useConfirm must be used inside OverlayRoot");
  return useCallback((options: Parameters<typeof context.confirm>[0]) => context.confirm(options), [context]);
}
