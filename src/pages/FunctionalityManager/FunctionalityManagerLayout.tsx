import { Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import SkeletonList from "./components/SkeletonList";

export default function FunctionalityManagerLayout() {
    const location = useLocation();
    const reduceMotion = useReducedMotion();

    return (
        <div className="flex min-h-full w-full min-w-0 flex-col">
            <motion.div
                key={`${location.pathname}${location.search}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.18 }}
                className="w-full min-w-0 flex-1"
            >
                <Suspense fallback={<SkeletonList rows={4} />}>
                    <Outlet />
                </Suspense>
            </motion.div>
        </div>
    );
}
