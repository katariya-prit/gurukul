import { useEffect, useState } from "react";

export interface NotificationPosition {
    top: number;
    left: number;
    width: number;
    availableHeight: number;
}

export function useNotificationPosition(anchor: HTMLElement | null) {
    const [positionState, setPositionState] = useState<{
        anchor: HTMLElement;
        position: NotificationPosition;
    } | null>(null);

    useEffect(() => {
        if (!anchor) {
            return;
        }

        const updatePosition = () => {
            const rect = anchor.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const width =
                viewportWidth < 640 ? Math.max(0, viewportWidth - 24) : 360;
            const left =
                viewportWidth < 640
                    ? 12
                    : Math.min(
                        Math.max(12, rect.right - width),
                        Math.max(12, viewportWidth - width - 12)
                    );
            const nextPosition = {
                top: rect.bottom + 10,
                left,
                width,
                availableHeight: Math.max(0, window.innerHeight - rect.bottom - 24),
            };

            setPositionState((current) =>
                current?.anchor === anchor &&
                    current.position.top === nextPosition.top &&
                    current.position.left === nextPosition.left &&
                    current.position.width === nextPosition.width &&
                    current.position.availableHeight === nextPosition.availableHeight
                    ? current
                    : { anchor, position: nextPosition }
            );
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        const observer =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
        observer?.observe(anchor);
        observer?.observe(document.body);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            observer?.disconnect();
        };
    }, [anchor]);

    return positionState?.anchor === anchor ? positionState.position : null;
}
